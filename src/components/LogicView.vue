<template lang="pug">
  div(class="logic-view-full-height")
    //- div(id="topnav" class="logic-view-topnav")
    //-   a(class="index") {{index}}
    //- div(id="side-nav" class="sidenav")
    //-   a(id="highlight" @click="openHighlightModal") Highlight
    //-   a(id="filter" @click="openKeyWordsTreeModal") Filter
    div(id="highlight-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Keyword Highlight List
          input(class="modal-input-text" type="text" id="highlight-input" placeholder="Keyword1,Keyword2,Keyword3...")
          input(class="modal-input-color" type="color" id="highlight-color")
          span(class="addBtn" @click="newHighlightItem") Add
        ul(id="highlight-list" style="list-style: none;")
    div(id="keywords-modal" class="keywords-modal")
      div(class="keywords-modal-content")
        //- div(id="keywords-graph" style="width:3000px;height:750px;")
        svg(id="keywords" width="1600" height="800")
    //- div(id="filter-modal" class="modal")
    //-   div(class="modal-content")
    //-     div(class="modal-header")
    //-       h2 Filter Keywords Graph
    //-       input(style="width: 100%;" class="modal-input-text" type="text" id="filter-input" placeholder="Keyword1,Keyword2,Keyword3...")
          //- v-on:scroll="scrollLogDetail"
    div(id="log-detail" class="overlay")
      div(class="overlay-content")
        div(id="log-detail-navbar" class="navbar")
          //- a Filter
          a(class="button" @click="exportExcel") Export
          a(class="button" @click="openHighlightModal") Highlight
          a(class="button" @click="openKeyWordsTreeModal") KeyWordsTree
          //- a(class="button" @click="closeLogDetail") Cancel
          a(class="title") {{ process }}
        table(id='content')
    div(id="graph-detail" class="overlay-graph" style="left: 100%;")
      div(id='graphs' class="overlay-content")
    div(class="loading hidden")
      div(class='uil-ring-css' style='transform:scale(0.79);')
        div
    template(v-if="isDiff === false")
      div(id="painting0" class="column-single")
        svg(id="viz0" :height="height" :width="width")
        div(id="tooltip0")
    template(v-else)
      div(id="painting0" class="column-double")
        svg(id="viz0" :height="height" :width="width")
        div(id="tooltip0")
      div(id="painting1" class="column-double")
        svg(id="viz1" :height="height" :width="width")
        div(id="tooltip1")
</template>

<script src="../theme/dark.js"></script>
<script>
import * as d3 from 'd3'
import * as echarts from 'echarts'

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
      devices: [],
      isDiff: false,
      filterGraphs: {},
      highlightKeyword: {'abn':'#FF9900', 'error,fault':'#FF0000'},
      prevScrollpos: 0,

      svg: '',
      svgKeywordsTree:'',
      keyWordsTree: {},
      drag: '',
      zoom: '',
      logNum : 10,
      data:[],
      dataTree:{},
      allData: [],
      subData: [],
      allLine: {},
      numLine: 0,
      selectedLine: {},
      graphLogData: [],
      invertedIndexTable: {},
      allInvertedIndexTable:{},
      width: 1000,
      height: 1200,

      graphHeight: 200,
      graphWidth: 550,

      yAxis:'',
      xAxis:'',

      graphHeight: 800,
      graphWidth: 1000,
    }
  },

  mounted () {
    this.$common.startLoading()

    let that = this
    this.$common.setBrowserTitle("Logic View")
    this.$common.setChartDartTheme(echarts)
    if(this.isDiff == true){
      this.width = document.body.offsetWidth / 2
    }else{
      this.width = document.body.offsetWidth
    }
    this.height = document.body.offsetHeight
    this.graphHeight = document.body.offsetHeight - 20

    // extract url param 
    var url = new URLSearchParams(`?${window.location.hash.split(/\?/)[1]}`)
    this.index = url.get('index')
    this.process = url.get('process')
    this.kv = url.get('kv')
    this.dataIndex = url.get('dataIndex')
    this.highlightKeyword = JSON.parse(url.get('highlightKeyword'))
    this.filterGraphs = JSON.parse(url.get('filterData')) 

    // document.getElementById("filter-input").value = this.filterGraphs.join(",")

    Object.keys(this.highlightKeyword).forEach((key) => {
      var li = document.createElement("li");
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

    this.getStoryLines (this.index)

    window.onclick = function(event) {
      if (event.target == document.getElementById("highlight-modal")) {
        // that.createHighlightPoint()
        that.$common.removeAllChildDom('content')
        that.openLogDetail(that.numLine, true)
        document.getElementById("highlight-modal").style.display = "none";
      }else if(event.target == document.getElementById("keywords-modal")){
        that.openLogDetail(that.numLine, true)
        document.getElementById("keywords-modal").style.display = "none";
      }
    }

  },
  methods: {
    async getStoryLines (index) {
      await this.$http.get(this.$urls.logs_trouble_shooting, {
        params: {
          index: index
        },
        })
        .then(response => {
          this.allData = response.data.content.story_line
          this.devices = Object.keys(this.allData)
          this.data = this.allData[this.devices[0]]

          var keywords = {}
          var filterData = {}
          var processes = {}
          keywords[index] = {}
          keywords[index][this.devices[0]] = {}
          this.data.forEach((item) => {
            processes[item['process']] = item['kv']
          })
          Object.keys(processes).sort().forEach((item) => {
            keywords[index][this.devices[0]][item] = processes[item]
            this.dataTree[item] = processes[item]
          })
          this.keyWordsTree = this.$common.generateKeyWordsTree(keywords)
          this.allInvertedIndexTable = response.data.content.inverted_index_table
          this.invertedIndexTable = this.allInvertedIndexTable[this.devices[0]]
          // this.resetCoordinates()
          // this.createTopNav()
          this.createKeyWordsTreeGraph()
          // this.createGraph(0)
          // this.createHighlightPoint()
          for (var i = 0; i < this.data.length; i++) {
            if(this.data[i]['process'] == this.process){
              this.graphLogData = this.data[i]
              if (this.kv.includes('(r)')) {
                var kv = this.kv.split('(r)')[0]+'(r)'
                this.numLine = parseInt(this.graphLogData.kv[kv][this.graphLogData.kv[kv].length-2][this.dataIndex])
                this.openLogDetail(this.numLine, true)
              }else{
                this.numLine = parseInt(this.graphLogData.kv[this.kv][this.graphLogData.kv[this.kv].length-2][this.dataIndex])
                this.openLogDetail(this.numLine, true)
              }
              break
            }
          }

          this.$common.stopLoading()
          // this.createGraph(2)
          // this.logs()
        })
    },
    resetCoordinates(){
      this.zoom = d3.zoom().scaleExtent([1, 2]).on("zoom", this.zoomed)
      d3.select("#viz0").call(this.zoom).on("dblclick.zoom", null)
    },
    resetKeywordsTreeCoordinates(){
      var zoom = d3.zoom().scaleExtent([1, 5]).on("zoom", this.zoomedKeywordsTree)
      d3.select("#keywords").call(zoom).on("dblclick.zoom", null)
    },
    zoomed(event) {
      const {transform} = event
      d3.select("#canvas0").attr("transform", transform)
    },
    zoomedKeywordsTree(event) {
      const {transform} = event
      d3.select("#canvas1").attr("transform", transform)
    },
    createTopNav(){
      let that = this
      this.devices.forEach((device, index) => {
        var a = document.createElement("a")
        if(index == 0){
          a.setAttribute('class', 'dev active')
        }
        a.innerHTML = device
        document.getElementById("topnav").appendChild(a)

        a.onclick = function() {
          document.getElementsByClassName("active")[0].removeAttribute("class");
          this.setAttribute('class', 'dev active')
          d3.select("#canvas0").remove()
          d3.select("#viz0").call(that.zoom.transform, d3.zoomIdentity)
          that.data = that.allData[this.innerHTML]
          that.invertedIndexTable = that.allInvertedIndexTable[this.innerHTML]
          that.createGraph(0)
        }
      })
    },
    createGraph (number) {
      let that = this
      this.yAxis = d3.scaleBand()
              .domain(d3.range(this.data.length))
              .range([0, this.height - this.margin.bottom - this.margin.top])
              .padding(0.2)

      this.xAxis = d3.scaleLinear()
            .domain([d3.min(this.data, d => parseInt(d.start_count)), d3.max(this.data, d => parseInt(d.end_count))])
            .range([0, this.width - this.margin.left - this.margin.right])

      function getTooltipContent(d) {
        var res = ''
        d.forEach((log) => {
          var style = '<b style="color:#FFFFFF">'
          Object.keys(that.highlightKeyword).forEach((item) => {
            item.split(/,/).forEach((key) => {
              if (that.invertedIndexTable.hasOwnProperty(key.toLowerCase())){
                if (that.invertedIndexTable[key]['x'].includes(log[0])){
                  style = `<b style="color:${that.highlightKeyword[item]}">`
                }
              }
            })
          })
          res = res + `${style}${log[1]}</b><br/>`
        })
        return res
      }

      function createTooltip(el) {
        el
          .style("position", "absolute")
          .style("pointer-events", "none")
          .style("top", 0)
          .style("opacity", 0)
          .style("background", "black")
          .style("border-radius", "5px")
          .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
          .style("padding", "10px")
          .style("line-height", "1.3")
          .style("font", "11px sans-serif")
      }

      function getRect(d){
        const el = d3.select(this);
        const sx = that.xAxis(parseInt(d.start_count));
        const ex = that.xAxis(parseInt(d.end_count));
        const w = that.xAxis(parseInt(d.end_count) - parseInt(d.start_count) < 20 ? 20 : parseInt(d.end_count) - parseInt(d.start_count));
        // const isLabelRight =(sx > width/2 ? sx+w < width : sx-w>0);
        el.style("cursor", "pointer")
        el
          .append("rect")
          .attr("x", sx)
          .attr("height", that.yAxis.bandwidth())
          .attr("width", w)
          .attr("fill", d.color);
        el
          .append("text")
          .text(d.process)
          .attr("x", ex+5)
          .attr("y", 0)
          .attr("fill", "#FFFFFF")
          .style("font-weight", "bold")
          .style("dominant-baseline", "hanging");
      }
      
      let filteredData = this.data;
      filteredData.forEach(d=> d.color = "#333")
      this.svg = d3.select(`#viz${number}`).append("g")
                    .attr("id", "canvas0")
                    .style("font", "8px sans-serif");
      const g = this.svg.append("g").attr("transform", (d,i)=>`translate(${this.margin.left} ${this.margin.top})`);
      const groups = g
        .selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "civ")

      const tooltip = d3.select(`#tooltip${number}`).call(createTooltip);
      this.createBookmark()
      const line = this.svg.append("line").attr("transform", `translate(${this.width - 100} 0)`)
                          .attr("y1", this.margin.top-10)
                          .attr("y2", this.height-this.margin.bottom)
                          .attr("stroke", "#FF3300FF")
                          .attr("stroke-width", 5)
                          // .style("pointer-events","none")
                          .style("cursor", "pointer")
                          .call(this.drag)

      groups.attr("transform", (d,i)=>`translate(0 ${this.yAxis(i)})`)
      groups
        .each(getRect)
        .on("mouseover", function(event, d) {
          d3.select(this).select("rect").attr("fill", "#CCFF00")
          that.subData = d
          tooltip
            .style("opacity", 1)
        })
        .on("mouseleave", function(event, d) {
          d3.select(this).select("rect").attr("fill", d.color)
          that.subData = []
          tooltip.style("opacity", 0)
        })
        .on("click", function(event, d) {
          let [x,y] = d3.pointer(event);
          var arr = Object.entries(that.subData.msg)
          var pos = d3.bisect(Object.keys(that.subData.msg).map(item => {return parseInt(item)}), that.xAxis.invert(x));
          var tmp = arr.slice(pos - that.logNum < 0 ? 0 : pos - that.logNum, pos + that.logNum > arr.length ? arr.length : pos + that.logNum);
          that.process = d['process']
          that.graphLogData = d
          that.openLogDetail(parseInt(tmp[0][1].split("||")[0]), true)
        })

      // svg
      //   .append("g")
      //   .attr("transform", (d,i)=>`translate(${margin.left} ${margin.top-10})`)
      //   .call(axisTop)

      // svg
      //   .append("g")
      //   .attr("transform", (d,i)=>`translate(${margin.left} ${height-margin.bottom})`)
      //   .call(axisBottom)

      this.svg.on("mousemove", (event) => {
        let [x,y] = d3.pointer(event);
        // line.attr("transform", `translate(${x} 0)`);
        x = x - that.margin.left
        y = y - that.margin.top

        if (that.subData.length != 0){
          var arr = Object.entries(that.subData.msg)
          var pos = d3.bisect(Object.keys(that.subData.msg).map(item => {return parseInt(item)}), that.xAxis.invert(x));
          var tmp = arr.slice(pos - that.logNum < 0 ? 0 : pos - that.logNum, pos + that.logNum > arr.length ? arr.length : pos + that.logNum);
          y = y + 20 + that.margin.top;
          // if(x>this.width/2) x = x - 100 + that.margin.left;
          // x = x - 100 + that.margin.left
          tooltip
            .style("left", 0)
            .style("top", 0)
            .html(getTooltipContent(tmp))
        }
      })
      this.createHighlightPoint()
    },
    createKeyWordsTreeGraph(){
      this.svgKeywordsTree = d3.select(`#keywords`).append("g")
              .attr("id", "canvas1")
              .style("font", "8px sans-serif");
      this.resetKeywordsTreeCoordinates()
      this.$common.createTreeSvg(this.keyWordsTree, this.svgKeywordsTree, this.filterGraphs)
    },
    createBookmark(){
      function dragstarted(event) {
        
      }
      function dragged(event) {
        d3.select(this).attr("transform", `translate(${event.x} 0)`)
      }
      function dragended(event) {

      }
      this.drag = d3.drag().on("drag", dragged)
    },
    createHighlightPoint(){
      let that =  this
      function getHighlightTriangle(d){
        const el = d3.select(this);
        const sx = that.xAxis(parseInt(d[0]));
        // el.style("cursor", "pointer")
        el
          .append('path')
          .attr("d", d3.symbol().type(d3.symbolTriangle).size(15))
      }
      d3.selectAll(".highlight").remove()
      Object.keys(this.highlightKeyword).forEach((item) => {
        item.split(/,/).forEach((key) => {
          if (this.invertedIndexTable.hasOwnProperty(key.toLowerCase()))
          {
            const g = this.svg.append("g").attr("transform", (d,i)=>`translate(${this.margin.left} ${this.margin.top})`);
            const groups = g
              .selectAll("g")
              .data(this.$common.zip(this.invertedIndexTable[key]['x'], this.invertedIndexTable[key]['y']))
              .enter()
              .append("g")
              .attr("class", "highlight")
            groups.attr("transform", (d,i)=>`translate(${this.xAxis(parseInt(d[0]))} ${this.yAxis(parseInt(d[1])) - 2}) rotate(60)`)
            groups
              .each(getHighlightTriangle)
              .style("fill", this.highlightKeyword[item]);
          }
        })
      })
    },
    openLogDetail(line, isRefreshGraph) {
      var content = document.getElementById('content')
      if (!content.hasChildNodes()) {
        Object.keys(this.graphLogData.msg).forEach((num, logIndex) => {
          var tr = document.createElement("tr")
          tr.setAttribute('id', `log${logIndex}`)
          var td = document.createElement("td")
          td.style.color = "#FFFFFF"
          Object.keys(this.highlightKeyword).forEach((item) => {
            item.split(/,/).forEach((key) => {
              if (this.invertedIndexTable.hasOwnProperty(key.toLowerCase())){
                if (this.invertedIndexTable[key]['x'].includes(num)){
                  td.style.color = this.highlightKeyword[item]
                }  
              }
            })
          })
          if(logIndex <= line){
            td.style['background-color'] = "#000080"
          }
          td.innerText = this.graphLogData.msg[num]
          tr.appendChild(td)
          content.appendChild(tr)
        })
        document.getElementById("log-detail").style.width = "50%"
        document.getElementById("log-detail-navbar").style.display = "block"
        
      }
      if(isRefreshGraph){
        this.openSequentialGraphDetail()
      }
      document.getElementById(`log${line-3}`).scrollIntoView(true)
    },
    closeLogDetail() {
      this.$common.removeAllChildDom('content')
      document.getElementById("log-detail").style.width = "0%";
      document.getElementById("log-detail-navbar").style.display = "none"
      this.closeGraphDetail()
    },
    scrollLogDetail(){
      var div = document.getElementById("log-detail")
      var currentScrollPos = div.scrollTop;

      if (this.prevScrollpos > currentScrollPos) {
        document.getElementById("log-detail-navbar").style.top = "0";
      } else {
        document.getElementById("log-detail-navbar").style.top = "-50px";
      }
      this.prevScrollpos = currentScrollPos;
    },
    openSequentialGraphDetail() {
      let that = this
      this.$common.removeAllChildDom("graphs")

      var graphs = []
      var processes = []
      // extrac need line
      Object.keys(this.filterGraphs).forEach((k) => {
        var item = this.filterGraphs[k]
        var tmp = ''
        if (item[1].includes('(r)')) {
          tmp = item[1].split('(r)')[0]+'(r)'
        }else{
          tmp = item[1]
        }
        if ((this.dataTree.hasOwnProperty(item[0]))&(this.dataTree[item[0]].hasOwnProperty(tmp))){
          // [process, key, [value, timestamp, processindex, globalindex]]
          graphs.push([item[0], item[1], this.dataTree[item[0]][tmp]])
          processes.push(item[0])
        }
      })
      processes = this.$common.arrayDuplicates(processes)
      
      // package line
      var option = this.$common.getChartConfig()
      var element = document.createElement("div")
      element.setAttribute('id', "Sequential")
      element.setAttribute('style', `width:${this.graphWidth}px;height:${this.graphHeight}px;`)
      document.getElementById('graphs').appendChild(element)
      var chart = echarts.init(document.getElementById("Sequential"), 'dark')

      option['title']['text'] = "Sequential"
      option['series'] = []
      option['yAxis'] = [
        {type: 'value'}
      ]
      var yAxisIndex = 0
      var legend = []
      var unselect = {}
      var globalPoints = []
      graphs.forEach((data) => {
        data[2].forEach((items, index) => {
          if(index < data[2].length-3){
            var d = []
            if (data[1].includes('(d)')){
              var categories = []
              items.forEach((item, i) => {
                var point = data[2][data[2].length-1][i]
                globalPoints.push(point)
                categories.push(item)
                d.push({'value': [parseInt(point), item], 'origin':item, 'processIndex':parseInt(data[2][data[2].length-2][i])})
              })
              categories = this.$common.arrayDuplicates(categories)
              option['yAxis'].push({
                type: 'category',
                data: categories
              })
              yAxisIndex = yAxisIndex + 1
              option['series'].push(
                {
                  name: `${data[0]}.${data[1]}.${index}`,
                  type: 'line',
                  yAxisIndex: yAxisIndex,
                  showSymbol: false,
                  data: d,
                }
              )
            }else if(data[1].includes('(r)')){
              items.forEach((item, i) => {
                var point = data[2][data[2].length-1][i]
                var bit = parseInt(data[1].split('(r)')[1].replace('bit',''))
                var hex2bin = this.$common.hex2bin(item)[31-bit]
                globalPoints.push(point)
                d.push({'value': [parseInt(point), hex2bin], 'origin':hex2bin, 'processIndex':parseInt(data[2][data[2].length-2][i])})
              })
              option['series'].push(
                {
                  name: `${data[0]}.${data[1]}.${index}`,
                  type: 'line',
                  yAxisIndex: 0,
                  showSymbol: false,
                  data: d,
                }
              )
            }else{
              var normalize = this.$common.normalize(items.map((v) => parseFloat(v)), 1)
              items.forEach((item, i) => {
                var point = data[2][data[2].length-1][i]
                globalPoints.push(point)
                d.push({'value': [parseInt(point), normalize[i][0]], 'origin':normalize[i][1], 'processIndex':parseInt(data[2][data[2].length-2][i])})
              })
              option['series'].push(
                {
                  name: `${data[0]}.${data[1]}.${index}`,
                  type: 'line',
                  yAxisIndex: 0,
                  showSymbol: false,
                  data: d,
                }
              )
            }
            this.allLine[`${data[0]}.${data[1]}.${index}`] = d 
            legend.push(`${data[0]}.${data[1]}.${index}`)
            unselect[`${data[0]}.${data[1]}.${index}`] = false
          }
        })
      })

      // create makeline by process, highlight.process
      processes.forEach((process) => {
        var makeLineAxis = []
        var markLine = {
          symbol: 'none',
          label:{
            // color:'#FFFFFF',
            fontSize:12,
          },
          lineStyle:{
            type:'dotted',
            width: 2
          },
          data:[]
        }
        Object.keys(this.highlightKeyword).forEach((item) => {
          item.split(/,/).forEach((key) => {
            if (this.invertedIndexTable.hasOwnProperty(key.toLowerCase()))
            {
              var processData = ''
              for (var i = 0; i < this.data.length; i++) {
                if(this.data[i]['process'] == process){
                  processData = this.data[i]
                  break
                }
              }

              var intersec = this.$common.arrayIntersection(this.invertedIndexTable[key]['x'], Object.keys(processData.msg))
              if (intersec.length > 0){
                intersec.forEach((elm) => {
                  // var pos = d3.bisect(globalPoints.map(v => {return parseInt(v)}), parseInt(elm));
                  markLine['data'].push({'xAxis': parseInt(elm), 'label': {'color': this.highlightKeyword[item], 'formatter':key, 'fontSize':10}})
                  makeLineAxis.push({'value':[parseInt(elm),0]})
                })
              }
            }
          })
        })

        legend.push("highlight"+"."+process)
        option['series'].push(
          {
            name: "highlight"+"."+process,
            type: 'line',
            showSymbol: false,
            data: makeLineAxis,
            markLine: markLine
          }
        )
      })
      
      // bind click event and paint
      option['legend']['selected'] = unselect
      option['legend']['data'] = legend
      option['xAxis']['type'] = 'value'
      chart.setOption(option)
      chart.on('click', function(params) {
        if(params['componentType'] != 'markLine'){
          that.numLine = params.data.processIndex
          if(params.seriesName.split('.')[0] != that.process){
            that.process = params.seriesName.split('.')[0]
            that.$common.removeAllChildDom('content')
            for (var i = 0; i < that.data.length; i++) {
              if(that.data[i]['process'] == that.process){
                that.graphLogData = that.data[i]
                break
              }
            }
            that.openLogDetail(that.numLine, false)
          }else{
            that.openLogDetail(that.numLine, false)
          }
        }
      });
      chart.on('legendselectchanged', function(params){
        that.selectedLine = params.selected
      });

      // open div
      document.getElementById("graph-detail").style.left = "50%"
      document.getElementById("graph-detail").style.width = "50%"
    },
    exportExcel(){
      var res = {}
      var item = {}
      Object.keys(this.selectedLine).forEach((line) => {
        if((this.selectedLine[line] == true)&(!line.includes('highlight'))){
          item[line] = null
        }
      })
      Object.keys(item).forEach((line) => {
        this.allLine[line].forEach((e) => {
          var tmp = {}
          tmp['GlobalIndex'] = e.value[0]
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
      var str =  "GlobalIndex,"+Object.keys(item).join(",")+"\n"
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
    closeGraphDetail() {
      var content = document.getElementById('graphs')
      while (content.firstChild) {
        content.removeChild(content.lastChild);
      }
      document.getElementById("graph-detail").style.width = "0%";
    },
    openHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "block"
    },
    closeHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "none"
    },
    openKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
      modal.style.display = "block"
    },
    closeKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
      modal.style.display = "none"
    },
    newHighlightItem(){
      let that = this
      var li = document.createElement("li");
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
    logs () {
      console.log(d3.select("#canvas0").node())
    }

  }
}
</script>

<style>
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
.overlay {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  overflow-x: scroll;
  transition: 0.5s;
}

.overlay-graph {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 1;
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
  margin-top: 0px;
}

.overlay-content .navbar {
  display: none;
  position: fixed;
  z-index: 2;
  overflow: hidden;
  background-color: #555; /* Black background color */
  top: 0; /* Stay on top */
  width: 50%; /* Full width */
  /* display: block; */
  transition: top 0.3s; /* Transition effect when sliding down (and up) */
}

.navbar .button {
  float: left;
  display: block;
  background-color: #FFCC00;
  color: white;
  text-align: center;
  padding: 5px;
  text-decoration: none;
  font-size: 24px;
  transition: 0.3s;
  border: 1px solid black;
}

.navbar .button:hover {
  background-color: #000; /* Add a hover color */
}

.navbar .title {
  float: right;
  color: white;
  display: block;
  padding: 5px;
  text-align: center;
  text-decoration: none;
  font-size: 24px;
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
  border: 1px solid rgb(255, 255, 255);
}

/* tr:nth-child(even) {
  background-color: #333;
} */

.graphs {
  border: 1px solid black;
}

/***************************************** top nav css */
.logic-view-topnav {
  overflow: hidden;
  background-color: #333;
}

.logic-view-topnav .index {
  float: right;
  color: #f2f2f2;
  text-align: center;
  padding: 7px 16px;
  text-decoration: none;
  font-size: 17px;
}

.logic-view-topnav .dev {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 7px 16px;
  text-decoration: none;
  font-size: 17px;
}

.logic-view-topnav .dev:hover {
  background-color: #ddd;
  color: black;
}

.logic-view-topnav .dev.active {
  background-color: #04AA6D;
  color: white;
}

/***************************************** side nav css */
.sidenav a {
  position: absolute; /* Position them relative to the browser window */
  left: -80px; /* Position them outside of the screen */
  transition: 0.3s; /* Add transition on hover */
  padding: 15px; /* 15px padding */
  width: 100px; /* Set a specific width */
  text-decoration: none; /* Remove underline */
  font-size: 20px; /* Increase font size */
  color: white; /* White text color */
  border-radius: 0 5px 5px 0; /* Rounded corners on the top right and bottom right side */
}

.sidenav a:hover {
  left: 0; /* On mouse-over, make the elements appear as they should */
}

#highlight{
  top: 70px;
  background-color: #FFCC00;
}

#filter{
  top: 150px;
  background-color: #FFCC00;
}

/***************************************** keywords modal css */
.keywords-modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 3; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
}

.keywords-modal-content {
  overflow: auto;
  position: relative;
  background-color: #555;
  margin: 5% auto;
  /* padding: 20px; */
  border: 1px solid #888;
  width: 95%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
  animation-name: animatetop;
  animation-duration: 0.4s
}

/***************************************** highlight modal css */
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 3; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  /* overflow: auto; Enable scroll if needed */
  /* background-color: rgb(0,0,0); Fallback color */
  /* background-color: rgba(0,0,0,0.4); Black w/ opacity */
}

/* Modal Content */
.modal-content {
  position: relative;
  background-color: #fefefe;
  margin: 5% auto;
  /* padding: 20px; */
  border: 1px solid #888;
  width: 50%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
  animation-name: animatetop;
  animation-duration: 0.4s
}

/* Modal Header */
.modal-header {
  padding: 50px 50px;
  background-color: #FFCC00;
  font-size: 25px; /* Increase font size */
  text-align: center;
  color: white;
}

/* Style the input */
.modal-header .modal-input-text {
  float: left;
  margin: 0;
  border: none;
  border-radius: 0;
  width: 70%;
  padding: 10px;
  font-size: 16px;
  background-color: white;
}

/* Style the input */
.modal-header .modal-input-color {
  margin: 0;
  width: 10%;
  height: 42px;
  padding: 0px 0px 0px 0px;
}

/* Style the "Add" button */
.modal-header .addBtn {
  padding: 10px;
  width: 20%;
  background: #d9d9d9;
  color: #555;
  float: right;
  text-align: center;
  font-size: 16px;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 0;
}
.modal-header .addBtn:hover {
  background-color: #bbb;
}

/* Modal Body */
/* .modal-body {padding: 2px 16px;} */

/* Add Animation */
@keyframes animatetop {
  from {top: -300px; opacity: 0}
  to {top: 0; opacity: 1}
}

/* Remove margins and padding from the list */
ul {
  margin: 0;
  padding: 0;
}

/* Style the list items */
ul li {
  display: flex;
  position: relative;
  padding: 12px 8px 12px 10px;
  list-style-type: none;
  background: #eee;
  font-size: 18px;
  transition: 0.2s;
}

ul li .text{
  width: 50%;
}

ul li .color{
  width: 10%;
  height: 50px;
  padding: 0px 0px 0px 0px;
}

/* Set all odd list items to a different color (zebra-stripes) */
ul li:nth-child(odd) {
  background: #f9f9f9;
}

/* Darker background-color on hover */
ul li:hover {
  background: #ddd;
}

/* Style the close button */
.close-list {
  position: absolute;
  right: 0;
  top: 0;
  padding: 12px 16px 12px 16px;
}
.close-list:hover {
  background-color: #f44336;
  color: white;
}
</style>