<template lang="pug">
  div(class="logic-view-full-height")
    div(id="topnav" class="topnav")
      input(id="cmd" type="text" placeholder="Search.." v-on:keydown="keyDownEvent" @focus="filterInputFocusEvent" @blur="filterInputBlurEvent")
      input(id="fileInput" type="file" style="display:none")
    ul(id="groups" class="topnav-drop-down")
    div(id="highlight-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Keyword Highlight List
          input(class="modal-input-text" type="text" id="highlight-input" placeholder="Keyword1,Keyword2,Keyword3...")
          input(class="modal-input-color" type="color" id="highlight-color")
          span(class="addBtn" @click="newHighlightItem") Add
        ul(id="highlight-list" style="list-style: none;")
    div(id="keywords-modal" class="modal-keywords")
      div(class="modal-content-keywords")
        template(v-if="viewMode === 'standard'")
          input(id="keywords-search" type="text" placeholder="Filter.." v-on:keyup.enter="filterKeyWordsTreeGraph")
        svg(id="keywords" width="1600" height="800")
    div(id="legend-config-modal" class="modal")
      div(class="modal-content")
        input(id="legend-search" type="text" class="filter" placeholder="Filter.." v-on:keyup.enter="filterLegendConfig")
        div(id="legend-config")

    //- Filter log and graph detail
    div(id="log-detail-filter" class="overlay-log-filter")
      div(class="overlay-content")
        a(id="log-detail-filter-zoom-btn" href="javascript:void(0)" class="zoom-btn" @click="zoomLogDetal") O
        table(id='content-filter')
    div(id="graph-detail-filter" class="overlay-graph-filter" style="left: 100%;")
      div(id='graphs-filter' class="overlay-content")

    div(id="snackbar" class="snackbar") Log Jump Success.

    div(class="loading hidden")
      div(class='uil-ring-css' style='transform:scale(0.79);')
        div
</template>

<script>
import * as d3 from 'd3'
import * as echarts from 'echarts'
import common from '../plugins/common'

export default {
  data () {
    return {
      margin: {
        top: 30,
        right: 80,
        bottom: 30,
        left: 30
      },
      index: '',
      process: '',
      kv: '',
      dataIndex: 0,
      highlightKeyword: {'abn':'#FF9900', 'error,fault':'#FF0000'},
      // standard mode global var
      filterGraphs: {},
      originLogs:{},
      keyWords: {},
      invertedIndexTable: {},
      keyWordsTree: {},
      selectableLines: [],
      selectedLines: {},
      selectedLinesOnGraph:{},
      allLine: {},
      graphLogData: [],
      isLogFullScreen: false,
      isGraphFullScreen: false,

      // filter mode global var
      cmdWords: [],
      filterFirstEntry: true,
      filterInvertedIndexTable:{},
      filterOriginLogs:{},
      filterKeyWords:{},
      filterTimestamp:[],
      filterExp:{},
      filterfilterGraphs:{},
      filteredKeyWords:{},
      filterKeyWordsTree: {},
      filterSelectableLines: [],
      filterSelectedLines: {},
      filterSelectedLinesOnGraph:{},
      filterAllLine: {},
      filterGraphLogData: {},
      isFilterLogFullScreen: false,
      isFilterGraphFullScreen: false,

      arrowEventNum:-1,
      arrowEventNumMax:0,
      inputWord:'',
      inputCursorStart:0,
      keyAndWordFlag: false,

      viewMode: 'standard',
      prevViewMode: '',
      svg: '',
      svgKeywordsTree:'',

      drag: '',
      zoom: '',
      logNum : 10,
      data:[],
      process_num:{},
      numLine: 0,

      width: 1000,
      height: 1200,

      yAxis:'',
      xAxis:'',

      graphHeight: 800,
      graphWidth: 1000,
    }
  },
  mounted () {
    let that = this
    this.$common.startLoading()
    // resize screen
    this.$common.setBrowserTitle("Logic View")
    this.$common.setChartDartTheme(echarts)
    this.width = document.body.offsetWidth
    this.height = document.body.offsetHeight
    this.graphHeight = document.body.offsetHeight - 50
    this.graphWidth = document.body.offsetWidth / 2

    
    // modal cancel event
    window.onclick = function(event) {
      if (event.target == document.getElementById("highlight-modal")) {
        if(that.viewMode == 'overview'){
          that.createHighlightPoint()
        }else if(that.viewMode == 'standard'){
          that.$common.removeAllChildDom('content-standard')
          that.openLogDetail(that.numLine, true)
        }
        document.getElementById("highlight-modal").style.display = "none";
      }else if(event.target == document.getElementById("keywords-modal")){
        if(that.viewMode == 'standard'){
          that.refreshSelectableLines()
          // that.$common.removeAllChildDom('content-standard')
          // that.graphLogData = []
          // that.openLogDetail(0, true)
        }else{
          that.refreshFilterSelectableLines()
        }
        document.getElementById("keywords-modal").style.display = "none";
      }else if(event.target == document.getElementById("legend-config-modal")){
        that.packageSelectedLinesYAxis()
        document.getElementById("legend-config-modal").style.display = "none";
        if(that.viewMode == 'standard'){
          that.openLogDetail(that.numLine, true)
        }else{
          that.openFilterLogDetail(that.numLine, true)
        }
      }
    }

    // file upload handle
    document.getElementById('fileInput').onchange = function (event) {
      var reader = new FileReader();
      reader.onload = onReaderLoad;
      reader.readAsText(event.target.files[0]);
    }
    function onReaderLoad(event){
      var obj = JSON.parse(event.target.result);
      that.filterGraphs = obj.filterData
      that.highlightKeyword = obj.highlightKeyword
      that.createKeyWordsTreeGraph()
      that.refreshSelectableLines()
    }

    this.getIndex(this.index)
    this.initHighlightModal()
  },
  methods: {
    async getIndex (index) {
      await this.$http.get(this.$urls.query_index, {
        params: {
          index: index
        },
        })
        .then(response => {
          this.filterOriginLogs = response.data.origin_lines
          this.filterInvertedIndexTable = response.data.inverted_index_table
          // console.log(this.invertedIndexTable)
          // this.initFilterMode()
          this.$common.stopLoading()
        })
    },

    resetKeywordsTreeCoordinates(){
      var zoom = d3.zoom().scaleExtent([1, 5]).on("zoom", this.zoomedKeywordsTree)
      d3.select("#keywords").call(zoom).on("dblclick.zoom", null)
      d3.select("#keywords").transition().call(zoom.transform, d3.zoomIdentity)
    },
    zoomedKeywordsTree(event) {
      const {transform} = event
      d3.select("#canvas1").attr("transform", transform)
    },

    openFilterLogDetail(line, isRefreshGraph) {
      var colorPalette = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42']
      var content = document.getElementById('content-filter')
      if ((!content.hasChildNodes()) & (Object.keys(this.filterGraphLogData).length > 0)) {
        var wordColorPattern = {}
        var count = 0
        this.cmdWords.forEach((word) => {
          if(!word.includes('@exp')){
            if(word.includes('(c)')){
              word = word.split('(c)')[0].replace('@', '')
            }
            wordColorPattern[word] = colorPalette[count]
            count = count + 1
          }
        })
        var jump = 0
        Object.keys(this.filterGraphLogData).forEach((num, logIndex) => {
          var tr = document.createElement("tr")
          tr.setAttribute('id', `filter-log${logIndex}`)
          var text = `<td style="color:#FFFFFF">${this.filterGraphLogData[num]}</td>`
          Object.keys(wordColorPattern).forEach((word) => {
            if(text.toLowerCase().includes(word.toLowerCase())){
              var replaceT = `<font color="${wordColorPattern[word]}">${word}</font>`
              var re = new RegExp(word,"gi");
              text = text.replace(re, replaceT)
            }
          })

          if(num == String(line)){
            tr.style['background-color'] = "#000080"
            tr.style['border'] = "1px solid #FFA500"
            jump = logIndex
          }
          tr.insertAdjacentHTML('beforeend', text)
          content.appendChild(tr)
        })
        document.getElementById(`filter-log${jump > 2 ? jump - 2 : jump}`).scrollIntoView(true)
      }
      
      document.getElementById("log-detail-filter").style.width = "100%"
      // if(isRefreshGraph){
      //   this.openFilterSequentialGraphDetail()
      // }
    },
    refreshFilterSelectableLines(){
      this.filterSelectableLines = []
      this.filterSelectedLines = []
      Object.keys(this.filterfilterGraphs).forEach((key) => {
        var keyword = this.filterfilterGraphs[key][1]
        var bit = ''
        if (keyword.includes('(r)')) {
          bit = 'bit'+keyword.split('bit')[1]
          keyword = keyword.split('bit')[0]
        }
        if (this.filteredKeyWords.hasOwnProperty(keyword)) {
          if (keyword.includes('(r)')) {
            var name = keyword + '.' + bit
          }else{
            var name = keyword
          }
          this.filterSelectableLines.push(name)
        }
      })
      this.createLegendConfigModal(this.filterSelectableLines, this.filterSelectedLines)
    },
    openFilterSequentialGraphDetail() {
      let that = this
      this.$common.removeAllChildDom("graphs-filter")

      this.isFilterGraphFullScreen = false

      // package line
      var option = this.$common.getChartConfig()
      option['title']['text'] = "Sequential"
      option['yAxis'] = []
      option['series'] = []
      var yAxisIndex = 0
      var legend = []
      var unselect = {}
      var leftYAxis = []
      var rightYAxis = []

      if (Object.keys(this.filterSelectedLines).length == 0) {
        option['yAxis'] = [{'type':'value'}]
      }

      Object.keys(this.filterSelectedLines).forEach((line) => {
        var d = []
        var keyword = line.includes('r') ? line.split('.')[0]+'.'+line.split('.')[1] : line 
        var value = []
        this.filteredKeyWords[keyword].forEach((d) => {
          this.filterKeyWords[keyword].forEach((i) => {
            if(i.globalIndex == d){
              value.push(i.value)
            }
          })
        })
        var timestamp = []
        this.filteredKeyWords[keyword].forEach((d) => {
          timestamp.push(this.filterTimestamp[d])
        })
        var globalIndex = this.filteredKeyWords[keyword]
        if (line.includes('(d)')){
          var categories = this.$common.arrayDuplicates(value)
        }
        // config yaxis
        var offsetNum = 0
        if (this.selectedLines[line] == 'left') {
          leftYAxis.push('left')
          offsetNum = leftYAxis.length - 1
        }else{
          rightYAxis.push('right')
          offsetNum = rightYAxis.length - 1
        }
        option['yAxis'].push({
          axisLabel: {
            textStyle:{
              fontSize: "8"
            },
          },
          type: line.includes('(d)') ? 'category' : 'value',
          name: line,
          nameTextStyle: {
            fontSize:'7',
            padding:[0, 0, -7 * offsetNum, 0],
          },
          position: this.filterSelectedLines[line], // left or right
          offset: 30 * offsetNum,
          data: line.includes('(d)') ? categories : null
        })

        // package xaxis data
        if (keyword.includes('(d)')){
          value.forEach((item, i) => {
            d.push({'value': [parseInt(globalIndex[i]), item], 'origin':item, 'timestamp':timestamp[i]})
          })
        }else if(keyword.includes('(r)')){
          value.forEach((item, i) => {
            var bit = parseInt(line.split('.')[2].replace('bit',''))
            var hex2bin = this.$common.hex2bin(item)[31-bit]
            d.push({'value': [parseInt(globalIndex[i]), hex2bin], 'origin':item, 'timestamp':timestamp[i]})
          })
        }else{ //(c)
          // var normalize = this.$common.normalize(items.map((v) => parseFloat(v)), 1)
          value.forEach((item, i) => {
            d.push({'value': [parseInt(globalIndex[i]), item], 'origin':item, 'timestamp':timestamp[i]})
          })
        }
        option['series'].push(
          {
            name: line,
            type: 'line',
            yAxisIndex: yAxisIndex,
            showSymbol: false,
            data: d,
          }
        )
        yAxisIndex = yAxisIndex + 1
        this.filterAllLine[line] = d
        legend.push(line)
        unselect[line] = false
      })
      // this.graphWidth = this.graphWidth + 100 * (yAxisIndex - 1)
      option['tooltip']['formatter'] = function(params){
        var ret = ''
        params.forEach((param) => {
          ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
        })
        return ret;
      }
      
      var element = document.createElement("div")
      element.setAttribute('id', "Sequential-filter")
      element.setAttribute('style', `width:${this.graphWidth}px;height:${this.graphHeight}px;`)
      document.getElementById('graphs-filter').appendChild(element)
      var chart = echarts.init(document.getElementById("Sequential-filter"), 'dark')
      
      // bind click event and paint
      option['legend']['selected'] = unselect
      option['legend']['data'] = legend
      option['xAxis']['type'] = 'value'
      // install tool button 
      option['toolbox']['feature'] = {
        myTool1:{
          show:true,
          title: 'Zoom Out',
          icon: 'path://M395.731085 571.196755l10.18176 10.18176q4.072704 4.072704 8.145408 7.63632t8.145408 7.63632l12.218112 12.218112q20.363521 20.363521 16.290817 35.636161t-25.454401 35.636161q-9.163584 10.18176-30.036193 31.054369t-44.799745 45.308833-46.32701 46.836098-34.617985 35.636161q-18.327169 18.327169-25.454401 32.072545t6.109056 26.981665q9.163584 9.163584 23.418049 24.436225t24.436225 25.454401q17.308993 17.308993 12.7272 30.545281t-30.036193 15.27264q-26.472577 3.054528-59.05421 7.127232t-67.199618 7.63632-67.708706 7.63632-60.581474 7.127232q-26.472577 3.054528-36.654337-6.618144t-8.145408-34.108897q2.036352-25.454401 5.599968-57.017858t7.63632-64.654178 7.63632-65.672354 6.618144-60.072386q3.054528-29.527105 16.799905-37.672513t31.054369 9.163584q10.18176 10.18176 26.472577 24.945313t27.490753 25.963489 21.381697 7.127232 23.418049-16.290817q13.236288-13.236288 36.145249-36.654337t47.854274-48.363362 48.363362-48.87245 37.672513-38.181601q6.109056-6.109056 13.745376-11.709024t16.799905-7.63632 18.836257 1.018176 20.872609 13.236288zM910.928158 58.036034q26.472577-3.054528 36.654337 6.618144t8.145408 34.108897q-2.036352 25.454401-5.599968 57.017858t-7.63632 64.654178-7.63632 66.181442-6.618144 60.581474q-3.054528 29.527105-16.799905 37.163425t-31.054369-9.672672q-10.18176-10.18176-27.999841-26.472577t-29.018017-27.490753-19.345345-9.672672-20.363521 13.745376q-14.254464 14.254464-37.163425 37.672513t-48.363362 49.381538-49.890626 50.399714l-37.672513 37.672513q-6.109056 6.109056-13.236288 12.218112t-15.781729 9.163584-18.327169 1.018176-19.854433-13.236288l-38.690689-38.690689q-20.363521-20.363521-17.818081-37.163425t22.908961-37.163425q9.163584-9.163584 30.545281-31.054369t45.817921-46.32701 47.345186-47.854274 36.145249-35.636161q18.327169-18.327169 22.908961-30.036193t-8.654496-24.945313q-9.163584-9.163584-21.890785-22.399873t-22.908961-23.418049q-17.308993-17.308993-12.7272-30.545281t30.036193-16.290817 58.545122-7.127232 67.708706-7.63632 67.708706-7.63632 60.581474-7.127232z',
          onclick: (e) =>{
            if(that.isFilterGraphFullScreen == false){
              document.getElementById("log-detail-filter-zoom-btn").style.display = "none"
              document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth}px;height:${that.graphHeight}px;`)
              chart.resize({height:that.graphHeight, width:document.body.offsetWidth})
              
              that.isFilterGraphFullScreen = true
              document.getElementById("graph-detail-filter").style.left = "0%"
              document.getElementById("graph-detail-filter").style.width = "100%"
            }else{
              document.getElementById("log-detail-filter-zoom-btn").style.display = "block"
              document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth / 2}px;height:${that.graphHeight}px;`)
              chart.resize({height:that.graphHeight, width:document.body.offsetWidth / 2})
 
              that.isFilterGraphFullScreen = false
              document.getElementById("graph-detail-filter").style.left = "50%"
              document.getElementById("graph-detail-filter").style.width = "50%"
              document.getElementById("log-detail-filter").style.width = "50%"
            }

          }
        },
        myTool2:{
          show:true,
          title: 'Edit',
          icon: 'path://M499.2 281.6l243.2 243.2L413.866667 853.333333H170.666667v-243.2l328.533333-328.533333z m0 123.733333L256 648.533333V768h119.466667l243.2-243.2-119.466667-119.466667zM614.4 170.666667L853.333333 413.866667l-72.533333 72.533333-243.2-243.2L614.4 170.666667z',
          onclick: (e) =>{
            var modal = document.getElementById("legend-config-modal")
            modal.style.display = "block"
          }
        },
        myTool3:{
          show:true,
          title: 'KeyWordsTree',
          icon: 'path://M554.666667 682.666667h85.333333v128h-213.333333v-128h85.333333v-128H256v128h85.333333v128H128v-128h85.333333v-170.666667h298.666667V384h-85.333333V256h213.333333v128h-85.333333v128h298.666666v170.666667h85.333334v128h-213.333334v-128h85.333334v-128h-256v128z m42.666666-384h-128v42.666666h128V298.666667zM298.666667 725.333333H170.666667v42.666667h128v-42.666667z m597.333333 0h-128v42.666667h128v-42.666667z m-298.666667 0h-128v42.666667h128v-42.666667z',
          onclick: (e) =>{
            that.openKeyWordsTreeModal()
          }
        },
        myTool4:{
          show:true,
          title: 'Export',
          icon: 'path://M712.533333 371.2l-128 128-59.733333-59.733333 128-128L597.333333 256l-42.666666-42.666667h256v256l-42.666667-42.666666-55.466667-55.466667zM657.066667 256H768v110.933333V256h-110.933333zM298.666667 298.666667v426.666666h426.666666v-256l85.333334 85.333334v256H213.333333V213.333333h256l85.333334 85.333334H298.666667z',
          onclick: (e) =>{
            that.exportExcel()
          }
        },
      }
      chart.setOption(option)
      chart.on('click', function(params) {
        if(params['componentType'] != 'markLine'){
          that.$common.removeAllChildDom('content-filter')
          that.openFilterLogDetail(params.data.value[0], false)
          that.openSnackbar()
        }
      });
      chart.on('legendselectchanged', function(params){
        that.filterSelectedLinesOnGraph = params.selected
      });

      // open div
      document.getElementById("graph-detail-filter").style.left = "50%"
      document.getElementById("graph-detail-filter").style.width = "50%"
    },
    retrievalTimestamp(params){
      var pos = d3.bisect(this.filterTimestamp, params.value.replace(/"/g, ''));
      if(params.operate == '>'){
        return Object.keys(this.filterOriginLogs).slice(pos, this.filterTimestamp.length)
      }else{
        return Object.keys(this.filterOriginLogs).slice(0, pos)
      }
    },
    retrievalKvRange(params){
      var keyName = params.name.replace('@', '')
      var sortdKV = this.filterKeyWords[keyName].sort(function(x, y){
                          return d3.ascending(x.value, y.value);
                        })

      var bisectDate = d3.bisector(function(d) { return d.value; }).left;
      var pos = bisectDate(sortdKV, parseFloat(params['value']))
      var tmp = []
      if(params.operate == '>'){
        tmp = sortdKV.slice(pos, sortdKV.length - 1)
      }else{
        tmp = sortdKV.slice(0, pos)
      }
      var res = []
      tmp.forEach((item) => {
        res.push(item['globalIndex'])
      })
      return res
    },
    retrievalKvEqual(params){
      var keyName = params.name.replace('@', '')
      var res = []
      this.filterKeyWords[keyName].forEach((item) => {
        if(item.value == params.value){
          res.push(item.globalIndex)
        }
      })
      return res
    },
    retrievalSymbol(params){
      var res = []
      params.forEach((item) => {
        var globalIndex = []
        if (this.filterExp.hasOwnProperty(item.name)){
          globalIndex = this.filterExp[item.name]
        }else{
          if (this.filterInvertedIndexTable.hasOwnProperty(item.name.toLowerCase())){
            globalIndex = this.filterInvertedIndexTable[item.name.toLowerCase()].global_index
          }
        }
        if(item.operate == '&'){
            res = this.$common.arrayIntersection(res, globalIndex)
          }else if(item.operate == '|'){
            res = this.$common.arrayExtend(res, globalIndex)
            res = this.$common.arrayDuplicates(res)
          }
      })
      return res
    },
    calExpress(express){
      var params = []
      if (express[0] == '(') {
        express = express.slice(1, express.length-1).replace(/\s+/g, ' ').trim()
      }else{
        express = express.replace(/\s+/g, ' ').trim()
      }
      if (express.includes('@timestamp')) {
        var time = express.match(/\"(.*?)\"/g)[0]
        if (express.indexOf('@timestamp') < express.indexOf(time)) {
          params = express.includes(' > ') ? {'name':'@timestamp', 'operate':'>', 'value':time} : {'name':'@timestamp', 'operate':'<', 'value':time}
        }else{
          params = express.includes(' > ') ? {'name':'@timestamp', 'operate':'<', 'value':time} : {'name':'@timestamp', 'operate':'>', 'value':time}
        }
        return this.retrievalTimestamp(params)
      }else if(express.includes('>') | express.includes('<') ){
        if (express.split(' ')[0][0] == '@') { //judge word first char is @ , Other express: isNaN(parseFloat(express.split(' ')[0]))
          params = express.includes(' > ') ? {'name':express.split(' ')[0], 'operate':'>', 'value':express.split(' ')[2]} : {'name':express.split(' ')[0], 'operate':'<', 'value':express.split(' ')[2]}
        }else{
          params = express.includes(' > ') ? {'name':express.split(' ')[2], 'operate':'<', 'value':express.split(' ')[0]} : {'name':express.split(' ')[2], 'operate':'>', 'value':express.split(' ')[0]}
        }
        this.cmdWords.push(params.name)
        return this.retrievalKvRange(params)
      }else if(express.includes('=')){
        if (express.split(' ')[0][0] == '@') { //judge word first char is @
          params = {'name':express.split(' ')[0], 'operate':'=', 'value':express.split(' ')[2]}
        }else{
          params = {'name':express.split(' ')[2], 'operate':'=', 'value':express.split(' ')[0]}
        }
        this.cmdWords.push(params.name)
        return this.retrievalKvEqual(params)
      }else{
        var words = express.split(' ')
        words.forEach((word, index) => {
          if (index == 0) { // first word default |
            this.cmdWords.push(word)
            params.push({'operate':'|', 'name':word})
          }else if(index < words.length - 1){
            if (word == '&') {
              this.cmdWords.push(words[index + 1])
              params.push({'operate':'&', 'name':words[index + 1]})
            }else if(word == '|'){
              this.cmdWords.push(words[index + 1])
              params.push({'operate':'|', 'name':words[index + 1]})
            }
          }
        })
        return this.retrievalSymbol(params)
      }
    },
    filter(){
      try{
        this.filterExp = []
        this.filterGraphLogData = {}
        this.filteredKeyWords = []
        this.filterfilterGraphs = []
        this.filterSelectedLines = {}
        var cmd = document.getElementById("cmd").value
        // var cmd = 'txlProcBranchH & (pmb | txAtt) & ((@Pma(c).0 > 11) & ((@timestamp > "2022-09-27 13:32:35.606385800") & (@timestamp < "2022-09-27 13:35:30.675762960")))'
        // { '0':
        // [ '(pmb | txAtt)',
        //   '((pma.0 > 11) & ((@timestamp > "2022-09-27 13:30:30") & (@timestamp < "2022-09-27 13:31:30.675762960")))' ],
        // '1':
        // [ '(pma.0 > 11)',
        //   '((@timestamp > "2022-09-27 13:30:30") & (@timestamp < "2022-09-27 13:31:30.675762960"))' ],
        // '2':
        // [ '(@timestamp > "2022-09-27 13:30:30")',
        //   '(@timestamp < "2022-09-27 13:31:30.675762960")' ] }
        
        // sort parentheses by priority. The deeper the nesting, the higher the priority.
        var leftP = []                                        
        var res = {}
        for (var i = 0; i < cmd.length; i++) {
          if (cmd[i] == '('){
              leftP.push(i)
          }
          if (cmd[i] == ')'){
            var priority = leftP.length
            var exp = cmd.slice(leftP.pop(), i+1)
            if ((exp != '(c)')&(exp != '(d)')&(exp != '(r)')) {
              if (!res.hasOwnProperty(priority)) {
                res[priority] = [exp]
              }else{
                res[priority].push(exp)
              } 
            }
          }
          res[0] = [cmd]
        }
        // { '2_0': '(@timestamp > "2022-09-27 13:30:30")',
        //   '2_1': '(@timestamp < "2022-09-27 13:31:30.675762960")',
        //   '1_0': '(pma.0 > 11)',
        //   '1_1': '(exp2_0 & exp2_1)',
        //   '0_0': '(pmb | txAtt)',
        //   '0_1': '(exp1_0 & exp1_1)' }
        // Calculation deeper by deeper
        var priority = Object.keys(res)
        priority.reverse()
        priority.forEach((p, pindex) => {
          res[p].forEach((express, eindex) => {
            if (res.hasOwnProperty(parseInt(p)+1)) {
              res[parseInt(p)+1].forEach((expName, nindex) => {
                if (express.includes(expName)) {
                  express = express.replace(expName, '@exp'+String(parseInt(p)+1)+'_'+String(nindex))
                }
              })
              this.filterExp['@exp'+String(p)+'_'+String(eindex)] = this.calExpress(express)
            }else{
              this.filterExp['@exp'+String(p)+'_'+String(eindex)] = this.calExpress(express)
            }
          })
        })
        var tmp = this.filterExp['@exp0_0'].map(v => {return parseInt(v)})
                  .sort(function(a, b) {
                    return a - b
                  })
        this.packageFilteredData(tmp)
      }
      catch(err){
        console.log(err)
        alert('Syntax format error!')
      }
    },
    packageFilteredData(res){
      // var cmd = 'txlProcBranchH & (pmb | txAtt) & ((@Pma(c).0 > 11) & ((@timestamp > "2022-09-27 13:32:35.606385800") & (@timestamp < "2022-09-27 13:35:30.675762960")))'
      // var res = this.filter(cmd)
      // var res = [21481, 21484, 21487, 21498, 21510, 21533, 21658, 21772, 21861, 21918, 22233, 22274, 22771, 22895, 23150, 23281, 23291, 23299, 23302, 23339, 23361, 23401, 23500]
      res = res.map(v => String(v))
      res.forEach((num) => {
        this.filterGraphLogData[num] = this.filterOriginLogs[num]
      })
      Object.keys(this.filterKeyWords).forEach((keyword) => {
        var globalIndices = this.filterKeyWords[keyword].map(a => a.globalIndex);
        var ret = this.$common.arrayIntersection(res,globalIndices)
        if (ret.length > 0) {
          this.filteredKeyWords[keyword] = ret
        }
      })
      this.filterKeyWordsTree = this.$common.generateFilterKeyWordsTree(this.filteredKeyWords)
      this.createKeyWordsTreeGraph()
      this.$common.removeAllChildDom('content-filter')
      this.openFilterLogDetail(0, true)
    },
    keyDownEvent(event){
      let that = this
      if(event.ctrlKey == true){
        return
      }
      if(event.key == 'ArrowDown'){
        if (this.arrowEventNum < this.arrowEventNumMax) {
          if (this.arrowEventNum >= 0) {
            document.getElementById(`keyword-num${this.arrowEventNum}`).style.backgroundColor = "#000"
          }
          this.arrowEventNum = this.arrowEventNum + 1 
          document.getElementById(`keyword-num${this.arrowEventNum}`).style.backgroundColor = "#666"
        }
        event.preventDefault()
      }else if(event.key == 'ArrowUp'){
        if(this.arrowEventNum > 0){
          document.getElementById(`keyword-num${this.arrowEventNum}`).style.backgroundColor = "#000"
          this.arrowEventNum = this.arrowEventNum - 1
          document.getElementById(`keyword-num${this.arrowEventNum}`).style.backgroundColor = "#666"
        }
        event.preventDefault()
      }else if(event.key == 'Enter'){
        if(this.arrowEventNum >= 0){
          var cmd = document.getElementById('cmd')
          var tmp = cmd.value.substring(0, this.inputCursorStart) + document.getElementById(`keyword-num${this.arrowEventNum}`).innerHTML
          cmd.value =  tmp + cmd.value.substring(this.inputCursorStart + this.inputWord.length, cmd.value.length)
          document.getElementById("cmd").selectionEnd = tmp.length
          this.$common.removeAllChildDom('groups')
          this.inputWord = ''
          this.keyAndWordFlag = false
          this.arrowEventNum = -1
        }else{
          this.$common.removeAllChildDom('groups')
          this.inputWord = ''
          this.keyAndWordFlag = false
          this.arrowEventNum = -1
          this.$common.startLoading()
          setTimeout(function(){ 
            that.filter() 
            that.$common.stopLoading()
          }, 50);
          
          // this.$common.stopLoading()
        }
      }else if(event.key == 'Backspace'){
        if(this.inputWord.length > 0){
          this.inputWord = this.inputWord.slice(0, this.inputWord.length - 1)
          if (this.inputWord.length > 0) {
            this.filterKeyWordsEvent()
          }else{
            this.$common.removeAllChildDom('groups')
          }
        }
      }else if(event.code == 'Space'){
        this.$common.removeAllChildDom('groups')
        this.inputWord = ''
      }else if(event.key == '@'){
        this.keyAndWordFlag = true
      }else if((event.key.length == 1)&(!['&','|','=','>','<','(',')','.','\"'].includes(event.key))){
        if(this.inputWord == ''){
          if(event.key.match(/[0-9]/g)){
            return
          }else{
            this.inputCursorStart = document.getElementById("cmd").selectionStart
          }
        }
        this.inputWord = this.inputWord + event.key 
        this.filterKeyWordsEvent()
      }
    },
    filterKeyWordsEvent(){
      let that = this
      this.$common.removeAllChildDom('groups')
      this.arrowEventNum = -1
      var num = 0

      var indices_sort = this.keyAndWordFlag == true ? Object.keys(this.filterKeyWords).sort() : Object.keys(this.filterInvertedIndexTable).sort()
      indices_sort.forEach((word) => {
        if (word.toUpperCase().indexOf(this.inputWord.toUpperCase()) > -1) {
          var li = document.createElement("li")
          li.setAttribute('id', `keyword-num${num}`)
          li.innerText = word
          li.onclick = function(){
            var cmd = document.getElementById('cmd')
            var tmp = cmd.value.substring(0, that.inputCursorStart) + word
            cmd.value =  tmp + cmd.value.substring(that.inputCursorStart + that.inputWord.length, cmd.value.length)
            document.getElementById("cmd").selectionEnd = tmp.length
            that.$common.removeAllChildDom('groups')
            that.inputWord = ''
            that.keyAndWordFlag = false
            this.arrowEventNum = -1
          }
          document.getElementById('groups').appendChild(li)
          num = num + 1
        }
      })
      this.arrowEventNumMax = num
    },
    filterInputFocusEvent(){
      if(this.inputWord.length > 0){
        this.filterKeyWordsEvent()
      }
    },
    filterInputBlurEvent(){
      this.$common.removeAllChildDom('groups')
    },
//////////////////////////// COMMON //////////////////////////
    closeLogDetail() {
      this.$common.removeAllChildDom('content')
      document.getElementById("log-detail").style.width = "0%";
      
      var content = document.getElementById('graphs')
      while (content.firstChild) {
        content.removeChild(content.lastChild);
      }
      document.getElementById("graph-detail").style.width = "0%";
    },
    createKeyWordsTreeGraph(isAllOpen=false){
      d3.select('#canvas1').remove()
      this.svgKeywordsTree = d3.select('#keywords').append("g")
                .attr("id", "canvas1")
                .style("font", "10px sans-serif")
              .append("g")
                .attr("transform", `translate(0,400)`)
      this.resetKeywordsTreeCoordinates()
      if(this.viewMode == 'standard'){
        this.$common.createTreeSvg(this.keyWordsTree, this.svgKeywordsTree, this.filterGraphs, isAllOpen)
      }else{
        this.$common.createTreeSvg(this.filterKeyWordsTree, this.svgKeywordsTree, this.filterfilterGraphs, isAllOpen)
      }
    },
    filterKeyWordsTreeGraph(){
      var word = document.getElementById('keywords-search').value
      if(word != ''){
        var res = {}
        Object.keys(this.keyWords).forEach((process) => {
          Object.keys(this.keyWords[process]).forEach((keyword) => {
            if(keyword.toLowerCase().includes(word.toLowerCase())){
              if(!res.hasOwnProperty(process)){
                res[process] = {}
              }
              res[process][keyword] = this.keyWords[process][keyword]
            }
          })
        })
        this.keyWordsTree = this.$common.generateKeyWordsTree(res)
        this.createKeyWordsTreeGraph(true)
      }else{
        this.keyWordsTree = this.$common.generateKeyWordsTree(this.keyWords)
        this.createKeyWordsTreeGraph()
      }
    },
    createLegendConfigModal(lines, select){
      let that = this
      this.$common.removeAllChildDom('legend-config')
      lines.forEach((key) => {
        var ul = document.createElement("ul")
        var li = document.createElement("li")
        li.setAttribute('class', 'li-legend')

        var form = document.createElement("form")
        form.setAttribute('id', key)
        form.setAttribute('name', key)

        // checkbox
        var inputCheckBox = document.createElement("input")
        inputCheckBox.setAttribute('type', "checkbox")
        if (select.hasOwnProperty(key)) {
          inputCheckBox.setAttribute('checked', "checked")
        }

        inputCheckBox.onclick = function() {
          if (select.hasOwnProperty(key)) {
            delete select[key]
          }else{
            select[key] = {}
          }
        }
        // key label
        var labelProcess = document.createElement("label")
        labelProcess.setAttribute('class', "container left")
        labelProcess.innerHTML = key

        // left axis
        var leftAxisLabel = document.createElement("label")
        leftAxisLabel.setAttribute('class', "container right")
        leftAxisLabel.innerHTML = "LeftAxis"

        var leftAxisRadio = document.createElement("input")
        leftAxisRadio.setAttribute('type', "radio")
        leftAxisRadio.setAttribute('name', key)
        leftAxisRadio.setAttribute('value', "left")
        leftAxisRadio.setAttribute('checked', "checked")
        var leftAxisSpan= document.createElement("span")
        leftAxisSpan.setAttribute('class', "checkmark")

        leftAxisLabel.appendChild(leftAxisRadio)
        leftAxisLabel.appendChild(leftAxisSpan)

        // right axis
        var rightAxisLabel = document.createElement("label")
        rightAxisLabel.setAttribute('class', "container right")
        rightAxisLabel.innerHTML = "RightAxis"

        var rightAxisRadio = document.createElement("input")
        rightAxisRadio.setAttribute('type', "radio")
        rightAxisRadio.setAttribute('name', key)
        rightAxisRadio.setAttribute('value', "right")
        var rightAxisSpan= document.createElement("span")
        rightAxisSpan.setAttribute('class', "checkmark")

        if (select.hasOwnProperty(key)) {
          if(select[key] == 'right'){
            leftAxisRadio.removeAttribute("checked")
            rightAxisRadio.setAttribute('checked', "checked")
          }
        }

        rightAxisLabel.appendChild(rightAxisRadio)
        rightAxisLabel.appendChild(rightAxisSpan)

        form.appendChild(inputCheckBox)
        form.appendChild(labelProcess)
        form.appendChild(rightAxisLabel)
        form.appendChild(leftAxisLabel)
        li.appendChild(form)
        ul.appendChild(li)
        document.getElementById('legend-config')
          .appendChild(ul)
      })
    },
    filterLegendConfig(){
      var word = document.getElementById("legend-search").value
      var filteredSelectableLine = []
      this.packageSelectedLinesYAxis()
      if(this.viewMode == 'standard'){
        this.selectableLines.forEach((key) => {
          if (key.toLowerCase().includes(word.toLowerCase())) {
            filteredSelectableLine.push(key)
          }
        })
        this.createLegendConfigModal(filteredSelectableLine, this.selectedLines)
      }else if(this.viewMode == 'filter'){
        this.filterSelectableLines.forEach((key) => {
          if (key.toLowerCase().includes(word.toLowerCase())) {
            filteredSelectableLine.push(key)
          }
        })
        this.createLegendConfigModal(filteredSelectableLine, this.filterSelectedLines)
      }
    },
    packageSelectedLinesYAxis(){
      if (this.viewMode == 'standard') {
        Object.keys(this.selectedLines).forEach((key) => {
          if (document.getElementById(key) != null) {
            this.selectedLines[key] = document[key][key].value
          }
        })
      }else{
        Object.keys(this.filterSelectedLines).forEach((key) => {
          if (document.getElementById(key) != null) {
            this.filterSelectedLines[key] = document[key][key].value
          }
        })
      }
    },
    openKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
      modal.style.display = "block"
    },
    closeKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
      modal.style.display = "none"
    },
    initHighlightModal(){
      let that = this
      Object.keys(this.highlightKeyword).forEach((key) => {
        var li = document.createElement("li");
        li.setAttribute('class', "li-highlight")
        var t = document.createElement("input");
        t.setAttribute('class', "text")
        t.setAttribute('value', key)
        var c = document.createElement("input")
        c.setAttribute('type', "color")
        c.setAttribute('class', "color")
        c.setAttribute('value', this.highlightKeyword[key])
        li.appendChild(t)
        li.appendChild(c)
        
        var span = document.createElement("SPAN");
        var txt = document.createTextNode("\u00D7");
        span.className = "close-list";
        span.appendChild(txt);
        li.appendChild(span);
        document.getElementById("highlight-list").appendChild(li);

        var close = document.getElementsByClassName("close-list");
        for (var i = 0; i < close.length; i++) {
          close[i].onclick = function() {
            var key = this.parentElement.querySelector('.text').value
            delete that.highlightKeyword[key]
            this.parentElement.style.display = "none";
          }
        }
      })
    },
    newHighlightItem(){
      let that = this
      var li = document.createElement("li");
      li.setAttribute('class', "li-highlight")
      var inputValue = document.getElementById("highlight-input").value;
      var colorValue = document.getElementById("highlight-color").value;
      this.highlightKeyword[inputValue] = colorValue

      var t = document.createElement("input");
      t.setAttribute('class', "text")
      t.setAttribute('value', inputValue)
      var c = document.createElement("input")
      c.setAttribute('type', "color")
      c.setAttribute('class', "color")
      c.setAttribute('value', colorValue)
      li.appendChild(t)
      li.appendChild(c)
      if (inputValue === '') {
        alert("You must write something!");
      } else {
        document.getElementById("highlight-list").appendChild(li);
      }
      document.getElementById("highlight-input").value = ""

      var span = document.createElement("SPAN");
      var txt = document.createTextNode("\u00D7");
      span.className = "close-list";
      span.appendChild(txt);
      li.appendChild(span);

      var close = document.getElementsByClassName("close-list");
      for (var i = 0; i < close.length; i++) {
        close[i].onclick = function() {
          var key = this.parentElement.querySelector('.text').value
          delete that.highlightKeyword[key]
          this.parentElement.style.display = "none";
        }
      }
    },
    openHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "block"
    },
    closeHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "none"
    },
    exportExcel(){
      var res = {}
      var item = {}
      var selectedLines = this.viewMode == 'standard' ? this.selectedLinesOnGraph : this.filterSelectedLinesOnGraph
      var allLines = this.viewMode == 'standard' ? this.allLine : this.filterAllLine
      Object.keys(selectedLines).forEach((line) => {
        if((selectedLines[line] == true)&(!line.includes('highlight'))){
          item[line] = null
        }
      })
      Object.keys(item).forEach((line) => {
        allLines[line].forEach((e) => {
          var tmp = {}
          tmp['timestamp'] = e.timestamp
          Object.keys(item).forEach((k) => {
            tmp[k] = null
          })
          if (res.hasOwnProperty(e.value[0])){
            var tmp = res[e.value[0]]
          }
          tmp[line] = e.origin
          res[e.value[0]] = tmp
        })
      })
      var str =  "timestamp,"+Object.keys(item).join(",")+"\n"
      // var nums = Object.keys(res).map(v => {return parseInt(v)}).sort()
      var exportData = []
      Object.keys(res).forEach((num) => {
        exportData.push(res[num])
      })
      for(var i=0; i< exportData.length; i++){
        for(const key in exportData[i]){
          str += `${exportData[i][key] + '\t'},`
        }
        str += '\n'
      }
      const uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(str)
      const link = document.createElement("a")
      link.href = uri
      link.download = 'export.csv'
      link.click()
    },
    zoomLogDetal(){
      var logElm = this.viewMode == 'standard' ? "log-detail-standard" : 'log-detail-filter'
      var graphElm = this.viewMode == 'standard' ? "graph-detail-standard" : 'graph-detail-filter'
      if (this.viewMode == 'standard') {
        if(this.isLogFullScreen == false){
        this.isLogFullScreen = true
        document.getElementById(logElm).style.width = "100%";
        document.getElementById(graphElm).style.left = "100%";
        document.getElementById(graphElm).style.width = "0%";
        }else{
          this.isLogFullScreen = false
          document.getElementById(logElm).style.width = "50%";
          document.getElementById(graphElm).style.left = "50%";
          document.getElementById(graphElm).style.width = "50%";
        }
      }else{
        if(this.isFilterLogFullScreen == false){
          this.isFilterLogFullScreen = true
          document.getElementById(logElm).style.width = "100%";
          document.getElementById(graphElm).style.left = "100%";
          document.getElementById(graphElm).style.width = "0%";
        }else{
          this.isFilterLogFullScreen = false
          document.getElementById(logElm).style.width = "50%";
          document.getElementById(graphElm).style.left = "50%";
          document.getElementById(graphElm).style.width = "50%";
        }
      }
    },
    openSnackbar(){
      var x = document.getElementById("snackbar");
      x.className = "show";
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
    },
    logs () {
      console.log(d3.select("#canvas0").node())
    }

  }
}
</script>

<style>
@import '../assets/styles/common.css';
@import '../assets/styles/modal.css';

* {
  box-sizing: border-box;
}

html,body {
  font-family: Arial;
  height: 100%;
  background: #555;
  margin: 0px 0px 0px 0px;
  overflow: hidden !important;
}

.logic-view-full-height {
  height: 100%;
  overflow: hidden !important;
}

/***************************************** multi screen */
.column-single {
  float: left;
  width: 100%;
  /* border: 1px solid rgb(255, 255, 255); */
}

.column-double {
  float: left;
  width: 50%;
  border: 1px solid rgb(255, 255, 255);
}

/***************************************** log detail css */
.overlay-log-standard {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 0;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  overflow-x: scroll;
  transition: 0.5s;
}

.overlay-graph-standard {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 0;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  overflow-x: scroll;
  transition: 0.5s;
}

.overlay-log-filter {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 0;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  overflow-x: scroll;
  transition: 0.5s;

}

.overlay-graph-filter {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 0;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  overflow-x: scroll;
  transition: 0.5s;
}

.overlay-content {
  /* position: relative; */
  top: 0%;
  width: 100%;
  text-align: left;
  font-size: 12px;
  margin-top: 30px;
}

table {
  /* position: relative; */
  margin-top: 20px;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  border: 1px solid #ddd;
}

th, td {
  white-space: nowrap;
  text-align: left;
}
</style>