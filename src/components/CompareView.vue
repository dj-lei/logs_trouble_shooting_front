<template lang="pug">
  div(class="compare-view-full-height")
    div(id="topnav" class="compare-view-topnav")
      form(class="form-inline")
        a(class="go" @click="go") GO
        a(class="func" @click="openKeyWordsTreeModal") KeyWordsTree
        a(class="func" @click="openHighlightModal") Highlight
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
    div(id="keywords-modal" class="keywords-modal")
      div(class="keywords-modal-content")
        //- div(id="keywords-graph" style="width:3000px;height:750px;")
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
      this.$common.createSequentialCompareGraph(graphs, this.graphHeight, this.graphWidth, this.highlightKeyword, this.filterData, this.$router)
      // this.$common.createStatisticsCompareGraph(graphs)
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
    openKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
      modal.style.display = "block"
    },
    closeKeyWordsTreeModal(){
      var modal = document.getElementById("keywords-modal")
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

/***************************************** keywords modal css */
.keywords-modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
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
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
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