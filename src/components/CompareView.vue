<template lang="pug">
  div(class="compare-view-full-height")
    div(id="topnav" class="topnav")
      a(class="btn" @click="openHighlightModal") Highlight

    div(id="highlight-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Keyword Highlight List
          input(class="modal-input-text" type="text" id="highlight-input" placeholder="Keyword1,Keyword2,Keyword3...")
          input(class="modal-input-color" type="color" id="highlight-color")
          span(class="addBtn" @click="newHighlightItem") Add
        ul(id="highlight-list" style="list-style: none;")

    //- div(id="keywords-modal" class="keywords-modal")
    //-   div(class="keywords-modal-content")
    //-     svg(id="keywords-svg" width="1600" height="800")

    template(v-if="viewMode === 'story'")
      div(class="story-compare")
        div(class="story1")
          svg(id="story1-svg" :height="height" :width="width")
        div(class="story2")
          svg(id="story2-svg" :height="height" :width="width")
    template(v-else-if="viewMode === 'key'")
      div(class="key-compare")
        svg(id="key-svg" :height="height" :width="width")

    div(class="loading hidden")
      div(class='uil-ring-css' style='transform:scale(0.79);')
        div
</template>

<script>
import * as echarts from 'echarts'
import * as d3 from 'd3'

export default {
  data () {
    return {
      margin: {
        top: 30,
        right: 0,
        bottom: 30,
        left: 0
      },
      viewMode: 'key',
      originLogs: {},
      keyWords: {},
      invertedIndexTable: {},
      highlightKeyword: {'abn':'#FF9900', 'error,fault':'#FF0000'},

      data: [],
      process_num:{},

      width: 1000,
      height: 1200,
    } 
  },

  mounted () {
    if(this.viewMode == 'story'){
      this.width = document.body.offsetWidth / 2
    }else{
      this.width = document.body.offsetWidth
    }
    this.height = document.body.offsetHeight
    this.getIndex('GLT_SUKAMULYA_CBN_CM_BXP_2051_telog.log_BXP_2051_radio6626_2022_10_10')
  },
  methods: {
    async getIndex (index) {
      await this.$http.get(this.$urls.logs_trouble_shooting, {
        params: {
          index: index
        },
        })
        .then(response => {
          this.originLogs = response.data.origin_logs
          this.keyWords = response.data.kv
          this.invertedIndexTable = response.data.inverted_index_table

          if(this.viewMode == 'story'){
            this.resetStory1LineCoordinates()
            this.resetStory2LineCoordinates()
            this.convertOriginLogsToStoryLine()
            this.createStoryCompareGraph()
          }else{
            this.resetKeyCompareCoordinates()
            this.createKeyCompareGraph()
          }
        })
    },
    resetStory1LineCoordinates(){
      var zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", this.zoomedStory1Line)
      d3.select("#story1-svg").call(zoom).on("dblclick.zoom", null)
    },

    resetStory2LineCoordinates(){
      var zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", this.zoomedStory2Line)
      d3.select("#story2-svg").call(zoom).on("dblclick.zoom", null)
    },

    resetKeyCompareCoordinates(){
      var zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", this.zoomedKeyCompare)
      d3.select("#key-svg").call(zoom).on("dblclick.zoom", null)
    },

    zoomedStory1Line(event) {
      const {transform} = event
      d3.select("#story1").attr("transform", transform)
    },

    zoomedStory2Line(event) {
      const {transform} = event
      d3.select("#story2").attr("transform", transform)
    },

    zoomedKeyCompare(event) {
      const {transform} = event
      d3.select("#key-compare").attr("transform", transform)
    },

    convertOriginLogsToStoryLine(){
      var res = {}
      Object.keys(this.originLogs).forEach((process) => {
        var globalIndex = Object.keys(this.originLogs[process])
        var startCount = globalIndex[0]
        var endCount = globalIndex[globalIndex.length - 1]
        res[startCount] = {'process':process, 'startCount':startCount, 'endCount':endCount}
      })
      Object.keys(res).forEach((startCount, index) => {
        this.data.push(res[startCount])
        this.process_num[res[startCount]['process']] = index
      })
    },

    createStoryCompareGraph(){
      this.createStoryLineGraph('#story1-svg', 'story1')
      this.createStoryLineGraph('#story2-svg', 'story2')
    },

    createStoryLineGraph (svgId, gId) {
      let that = this
      this.yAxis = d3.scaleBand()
              .domain(d3.range(this.data.length))
              .range([0, this.data.length * 15 - this.margin.bottom - this.margin.top])
              .padding(0.3)

      this.xAxis = d3.scaleLinear()
            .domain([d3.min(this.data, d => parseInt(d.startCount)), d3.max(this.data, d => parseInt(d.endCount))])
            .range([0, this.width - this.margin.left - this.margin.right])

      function getRect(d){
        const el = d3.select(this);
        const sx = that.xAxis(parseInt(d.startCount));
        const ex = that.xAxis(parseInt(d.endCount));
        const w = that.xAxis(parseInt(d.endCount) - parseInt(d.startCount) < 20 ? 20 : parseInt(d.endCount) - parseInt(d.startCount));
        // const isLabelRight =(sx > width/2 ? sx+w < width : sx-w>0);
        // el.style("cursor", "pointer")
        el
          .append("rect")
          .attr("x", sx)
          .attr("height", that.yAxis.bandwidth())
          .attr("width", w)
          .attr("fill", d.color);
        el
          .append("text")
          .text(d.process)
          .attr("text-anchor", "end")
          .attr("x", sx-2)
          .attr("y", 2)
          .attr("fill", "#FFFFFF")
          .style("font-weight", "bold")
          .style("dominant-baseline", "hanging");
      }
      
      let filteredData = this.data;
      filteredData.forEach(d=> d.color = "#333")
      this.svg = d3.select(svgId).append("g")
                    .attr("id", gId)
                    .style("font", "8px sans-serif")

      const g = this.svg.append("g").attr("transform", (d,i)=>`translate(${this.margin.left} ${this.margin.top})`)
      const groups = g
        .selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "civ")

      this.createBookmarkDrag()
      // Bookmark line
      const line = this.svg.append("line").attr("transform", `translate(${this.width - 100} 0)`)
                          .attr("y1", this.margin.top-10)
                          .attr("y2", this.data.length * 15 -this.margin.bottom)
                          .attr("stroke", "#FF3300FF")
                          .attr("stroke-width", 5)
                          // .style("pointer-events","none")
                          .style("cursor", "pointer")
                          .call(this.drag)

      groups.attr("transform", (d,i)=>`translate(0 ${this.yAxis(i)})`)
      groups
        .each(getRect)
        .on("mouseover", function(event, d) {
          d3.select(this).select("rect").attr("fill", "#FFA500")
          d3.select(this).select("text").attr("fill", "#FFA500")
          // tooltip
          //   .style("opacity", 1)
        })
        .on("mouseleave", function(event, d) {
          d3.select(this).select("rect").attr("fill", d.color)
          d3.select(this).select("text").attr("fill", "#FFFFFF")
          // tooltip.style("opacity", 0)
        })

    },

    createBookmarkDrag(){
      function dragstarted(event) {
        
      }
      function dragged(event) {
        d3.select(this).attr("transform", `translate(${event.x} 0)`)
      }
      function dragended(event) {

      }
      this.drag = d3.drag().on("drag", dragged)
    },

    createKeyCompareGraph(){
      var svg = d3.select('#key-svg').append("g")
                  .attr("id", "key-compare")
                  .style("font", "10px sans-serif")

      var process = 'txlProcBranchH'
      Object.keys(this.keyWords[process]).forEach((keyword, index) => {
        // console.log(keyword)
        var value = this.keyWords[process][keyword][0]
        var globalIndex = this.keyWords[process][keyword][this.keyWords[process][keyword].length - 1]
        var timestamp = this.keyWords[process][keyword][this.keyWords[process][keyword].length - 3]
        
        var d = []
        var option = this.$common.getChartConfig()

        if (keyword.includes('(d)')){
          var categories = this.$common.arrayDuplicates(value)
        }

        option['yAxis'] = {
          type: keyword.includes('(d)') ? 'category' : 'value',
          name: keyword,
          data: keyword.includes('(d)') ? categories : null
        }
        
        // package xaxis data
        if (keyword.includes('(d)')){
          value.forEach((item, i) => {
            d.push({'value': [parseInt(globalIndex[i]), item], 'origin':item, 'timestamp':timestamp[i]})
          })
        }else if(keyword.includes('(r)')){
          return
          // value.forEach((item, i) => {
          //   var bit = parseInt(keyword.split('.')[2].replace('bit',''))
          //   var hex2bin = this.$common.hex2bin(item)[31-bit]
          //   d.push({'value': [parseInt(globalIndex[i]), hex2bin], 'origin':item, 'timestamp':timestamp[i]})
          // })
        }else{ //(c)
          value.forEach((item, i) => {
            d.push({'value': [parseInt(globalIndex[i]), item], 'origin':item, 'timestamp':timestamp[i]})
          })
        }

        option['title']['text'] = keyword
        option['xAxis']['type'] = 'value'
        option['series'] = [
                            {
                              name: keyword,
                              type: 'line',
                              data: d,
                              showSymbol: false,
                            }
                          ]

        var makeLineAxis = []
        var markLine = {
          silent: true, // mouse move no event
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
              var intersec = this.$common.arrayIntersection(this.invertedIndexTable[key.toLowerCase()]['x'], Object.keys(this.originLogs[process]))
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
        option['series'].push(
          {
            name: "highlight",
            type: 'line',
            showSymbol: false,
            data: makeLineAxis,
            markLine: markLine
          }
        )

        option['tooltip']['formatter'] = function(params){
          var ret = ''
          params.forEach((param) => {
            if(param['seriesName'].split('.')[0] != 'highlight'){
              ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
            }
          })
          return ret;
        }

        var id = keyword.replace("(","").replace(")","")
        svg.append("g")
            .append("foreignObject")
            .attr('x', index * 400 + 600)
            .attr('y', 0)
            .attr("width", 400)
            .attr("height", 300)
            .html(`<div id="${id}" style="width: 400px;height:300px;" >`)

        var chart = echarts.init(document.getElementById(id), 'dark')
        chart.setOption(option)
      })
    },

    openHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "block"
    },

    closeHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "none"
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
  overflow: auto !important;
}

.compare-view-full-height {
  position: sticky !important;
  height: 100%;
  /* overflow-y: hidden !important; */
}

/***************************************** multi screen */
.story-compare {
  width: 100%;
}

.story-compare .story1 {
  float: left;
  width: 50%;
  border: 1px solid rgb(255, 255, 255);
}

.story-compare .story2 {
  float: left;
  width: 50%;
  border: 1px solid rgb(255, 255, 255);
}

.key-compare {
  width: 100%;
}

</style>