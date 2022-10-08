<template lang="pug">
  div(class="compare-view-full-height")
    div(id="topnav" class="compare-view-topnav")
      form(class="form-inline")
        a(class="go" @click="go") GO
        a(class="func" @click="openKeyWordsTreeModal") KeyWordsTree
        a(class="func" @click="openHighlightModal") Highlight
        a(class="func" @click="openPaintCategoryModal") PaintCategory
        a(class="func" @click="exportConfig") ExportConfig
        a(class="func" @click="loadConfig") LoadConfig
        input(id="fileInput" type="file" style="display:none")
    div(id="highlight-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Keyword Highlight List
          input(class="modal-input-text" type="text" id="highlight-input" placeholder="Keyword1,Keyword2,Keyword3...")
          input(class="modal-input-color" type="color" id="highlight-color")
          span(class="addBtn" @click="newHighlightItem") Add
        ul(id="highlight-list" style="list-style: none;")
    div(id="paint-category-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Paint Category
          form(name="paintCategory")
            label(class="container") sequential
              input(type="radio" checked="checked" name="radio" value="sequential")
              span(class="checkmark")
            label(class="container") statistics
              input(type="radio" name="radio" value="statistics")
              span(class="checkmark")
    div(id="graph-config-modal" class="modal")
      div(class="modal-content")
        div(class="modal-header")
          h2 Bisection Or Manual Config
          input(class="modal-input-text" type="text" id="interval-input" placeholder="Interval1,Interval2,Interval3...")
    
    div(id="full-graph-modal" class="full-screen-modal")
      div(class="full-screen-modal-content")
        div(id="full-graph" style=`width:1800px;height:800px;`)

    div(id="keywords-modal" class="keywords-modal")
      div(class="keywords-modal-content")
        svg(id="viz" width="1600" height="800")
    div(id="graphs" class="graphs")
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
        right: 80,
        bottom: 30,
        left: 30
      },
      data: {},
      keyWordsTree: {},
      originIndex: {},
      invertedIndexTable: {},
      svg:'',
      zoom:'',
      index:[''],
      filterData: {},
      highlightKeyword: {'abn':'#FF9900', 'error,fault':'#FF0000'},
      paintCategory: 'sequential',
      bisection: 10,
      graphHeight: 200,
      graphWidth: 550,
    } 
  },

  mounted () {
    this.$common.startLoading()

    let that = this
    this.$common.setBrowserTitle("Compare View")
    this.$common.setChartDartTheme(echarts)
    this.getKeyValues(new URLSearchParams(`?${window.location.hash.split(/\?/)[1]}`).get('index'))
  
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

    window.onclick = function(event) {
      if (event.target == document.getElementById("highlight-modal")) {
        document.getElementById("highlight-modal").style.display = "none";
      }else if (event.target == document.getElementById("keywords-modal")) {
        document.getElementById("keywords-modal").style.display = "none";
      }else if (event.target == document.getElementById("graph-config-modal")) {
        document.getElementById("graph-config-modal").style.display = "none";
      }else if (event.target == document.getElementById("paint-category-modal")) {
        document.getElementById("paint-category-modal").style.display = "none";
      }else if (event.target == document.getElementById("full-graph-modal")) {
        document.getElementById("full-graph-modal").style.display = "none";
      }
    }

    document.getElementById('fileInput').onchange = function (event) {
      var reader = new FileReader();
      reader.onload = onReaderLoad;
      reader.readAsText(event.target.files[0]);
    }
    function onReaderLoad(event){
      var obj = JSON.parse(event.target.result);
      that.filterData = obj.filterData
      that.highlightKeyword = obj.highlightKeyword
      d3.select(`#canvas`).remove()
      that.createKeyWordsTreeGraph()
    }

    var rad = document.paintCategory.radio;
    var prev = null;
    for (var i = 0; i < rad.length; i++) {
        rad[i].addEventListener('change', function() {
            if (this !== prev) {
                prev = this;
            }
            that.paintCategory = this.value
        });
    }
  },
  methods: {
    async getKeyValues (index) {
      await this.$http.get(this.$urls.logs_key_values, {
        params: {
          index: index
        },
        })
        .then(response => {
          this.data = response.data.story_line
          this.originIndex = response.data.origin_index
          this.invertedIndexTable = response.data.inverted_index_table
          this.keyWordsTree = this.$common.generateKeyWordsTree(this.data)
          this.createKeyWordsTreeGraph()
          this.createGraph()
          this.$common.stopLoading()
        })
    },
    resetCoordinates(){
      this.zoom = d3.zoom().scaleExtent([1, 5]).on("zoom", this.zoomed)
      d3.select("#viz").call(this.zoom).on("dblclick.zoom", null)
    },
    zoomed(event) {
      const {transform} = event
      d3.select("#canvas").attr("transform", transform)
    },
    createGraph () {
      let that = this
      var graphs = {}

      var selected = {}
      Object.keys(this.filterData).forEach((item) => {
        if (!selected.hasOwnProperty(this.filterData[item][0])){
          selected[this.filterData[item][0]] = []
        }

        if (this.filterData[item][1].includes("(d)")){
          selected[this.filterData[item][0]].push([this.filterData[item][1], "discrete"])
        }else if(this.filterData[item][1].includes("(c)")){
          selected[this.filterData[item][0]].push([this.filterData[item][1], "continuous"])
        }else if(this.filterData[item][1].includes("(r)")){
          selected[this.filterData[item][0]].push([this.filterData[item][1].split("(r)")[0]+'(r)', "register", parseInt(this.filterData[item][1].split("(r)")[1].replace("bit",""))])
        }
      })
      Object.keys(this.data).forEach((index) => {
        Object.keys(this.data[index]).forEach((dev) => {
          Object.keys(selected).forEach((process) => {
            selected[process].forEach((item) => {
              var kv = item[0]
              if(this.data[index][dev].hasOwnProperty(process)){
                if(this.data[index][dev][process].hasOwnProperty(kv)){
                  if (!graphs.hasOwnProperty(process)){
                    graphs[process] = {}
                  }
                  var markLine = this.$common.invertedIndexTableQuery(this.invertedIndexTable[index][dev], this.originIndex[index][dev][process], this.data[index][dev][process][kv][this.data[index][dev][process][kv].length - 1].map(item => {return parseInt(item)}), this.highlightKeyword)
                  
                  var kvData = this.data[index][dev][process][kv].slice(0, this.data[index][dev][process][kv].length - 2)
                  if(item[1] == "register"){
                    kv = kv + "_bit" + String(item[2])
                  }

                  if (!graphs[process].hasOwnProperty(kv)){
                    graphs[process][kv] = [[index, dev, kvData, markLine, item]]
                  }else{
                    graphs[process][kv].push([index, dev, kvData, markLine, item])
                  }
                }
              }
            })
          })
        })
      })
      if(this.paintCategory == 'sequential'){
        this.$common.createSequentialCompareGraph(graphs, this.graphHeight, this.graphWidth, this.highlightKeyword, this.filterData, this.$router)
      }else{
        this.$common.createStatisticsCompareGraph(graphs, this.bisection)
      }
    },
    createKeyWordsTreeGraph(){
      this.svg = d3.select(`#viz`).append("g")
              .attr("id", "canvas")
              .style("font", "10px sans-serif")
            .append("g")
              .attr("transform", `translate(0,400)`)
      this.resetCoordinates()
      this.$common.createTreeSvg(this.keyWordsTree, this.svg, this.filterData)
    },
    clearChildDoms(id){
      var content = document.getElementById(id)
      while (content.firstChild) {
        content.removeChild(content.lastChild);
      }
    },
    go () {
      this.clearChildDoms('graphs')
      this.createGraph()
    },
    openHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "block"
    },
    closeHighlightModal(){
      var modal = document.getElementById("highlight-modal")
      modal.style.display = "none"
    },
    openPaintCategoryModal(){
      var modal = document.getElementById("paint-category-modal")
      modal.style.display = "block"
    },
    closePaintCategoryModal(){
      var modal = document.getElementById("paint-category-modal")
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
    openFullGraphModal(){
      var modal = document.getElementById("full-graph-modal")
      modal.style.display = "block"
    },
    closeFullGraphModal(){
      var modal = document.getElementById("full-graph-modal")
      modal.style.display = "none"
    },
    exportConfig(){
      var res = {}
      res['filterData'] = this.filterData
      res['highlightKeyword'] = this.highlightKeyword
      this.$common.exportJosnToLocalTxt(res, 'config.txt')
    },
    loadConfig(){
      document.getElementById('fileInput').click()
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
  background: #000000;
  margin: 0px 0px 0px 0px;
  overflow: auto !important;
}

.compare-view-full-height {
  position: sticky !important;
  height: 100%;
  /* overflow-y: hidden !important; */
}

.compare-view-topnav {
  overflow: hidden;
  background-color: #333;
  color: white;
  padding: 5px 0px 5px 0px;
}

.compare-view-topnav label{
  font-size: 20px; /* Increased font size */
  padding: 10px 10px 0px 10px;
}

.compare-view-topnav input{
  background-color: white;
  border: 1px solid black;
}

.compare-view-topnav .go{
  float: right;
  width: 200px;
  text-align: center; /* Center-align text */
  color: white; /* White text color */
  font-size: 30px; /* Increased font size */
  border: 1px solid black;
}

.compare-view-topnav .func{
  float: left;
  margin-right: 10px;
  width: 200px;
  text-align: center; /* Center-align text */
  color: white; /* White text color */
  font-size: 30px; /* Increased font size */
  background-color: #FFCC00;
}

.compare-view-topnav a:hover {
  background-color: #000; /* Add a hover color */
}

.graphs{
  height: 100%;
}

.row {
  width: 100%;
  display: inline-block;
  overflow-x: scroll;
  overflow-y: hidden;
  white-space: nowrap;
}

.row .name{
  position: absolute;
  z-index: 1;
  writing-mode: tb-rl;
  background-color: #555;
  text-align: center;
  color: white;
  padding: 0px 5px 0px 5px;
}

.row .graph-row{
  margin-left: 28px;
}

.row .graph-row div{
  display: inline-block;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid rgb(255, 255, 255);
}

</style>