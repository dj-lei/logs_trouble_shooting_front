<template lang="pug">
  //- div(style="background-color:#000000")
  div(class="page")
    div(id="topnav" class="topnav")
      form(class="form-inline")
        label Process:
        input(id="process" type="text")
        label Keywords:
        input(id="keywords" type="text")
        a(@click="go") GO
    div(id="graphs" class="graphs")

</template>

<script>
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
      index:[''],
      filterProcess: ['txlProcBranch'],
      filterKey: ['pma', 'pmb', 'txatt'],
      graphHeight: 200,
      graphWidth: 700,
    } 
  },

  mounted () {
    document.getElementById("process").value = this.filterProcess.join(",")
    document.getElementById("keywords").value = this.filterKey.join(",")
    this.getKeyValues(new URLSearchParams(`?${window.location.hash.split(/\?/)[1]}`).get('index'))
  },
  methods: {
    async getKeyValues (index) {
      await this.$http.get(this.$urls.logs_key_values, {
        params: {
          index: index
        },
        })
        .then(response => {
          this.data = response.data.content
          this.createGraph()
        })
    },
    createGraph () {
      let that = this
      var graphs = {}
      Object.keys(this.data).forEach((index) => {
        Object.keys(this.data[index]).forEach((dev) => {
          Object.keys(this.data[index][dev]).forEach((process) => {
            this.filterProcess.forEach((pword) => {
              if (process.toLowerCase().includes(pword.toLowerCase())) {
                Object.keys(this.data[index][dev][process]).forEach((kv) => {
                  this.filterKey.forEach((kword) => {
                    if (kv.toLowerCase().includes(kword.toLowerCase())) {
                      if (!graphs.hasOwnProperty(process)){
                        graphs[process] = {}
                      }
                      if (!graphs[process].hasOwnProperty(kv)){
                        graphs[process][kv] = [[index, dev, this.data[index][dev][process][kv].slice(0, this.data[index][dev][process][kv].length - 1)]]
                      }else{
                        graphs[process][kv].push([index, dev, this.data[index][dev][process][kv].slice(0, this.data[index][dev][process][kv].length - 1)])
                      }
                    }
                  })
                })
              }
            })
          })
        })
      })
      var option = this.$common.getChartConfig()
      var processes = Object.keys(graphs).sort()
      processes.forEach((process) => {
        var name = document.createElement("div")
        name.setAttribute('class', "name")
        name.setAttribute('style', `height:${this.graphHeight}px;`)
        name.innerHTML = process
        
        var row = document.createElement("div")
        row.setAttribute('class', "row")
        row.appendChild(name)
        document.getElementById('graphs').appendChild(row)

        Object.keys(graphs[process]).forEach((kv) => {
          
          var pack = {}
          graphs[process][kv].forEach((item) => {
            item[2].forEach((data, index) => {
              if (!pack.hasOwnProperty(`${index}`)){
                pack[`${index}`] = []
              }
              pack[`${index}`].push([item[0], data])
            })
          })

          var items = Object.keys(pack).sort()
          items.forEach((item, index) => {
            var graph = document.createElement("div")
            graph.setAttribute('id', `${process}${kv}${index}`)
            graph.setAttribute('style', `width:${this.graphWidth}px;height:${this.graphHeight}px;`)
            row.appendChild(graph)

            var chart = echarts.init(document.getElementById(`${process}${kv}${index}`))
            option['title']['text'] = `${kv}_${index}`
            option['series'] = []
            var legend = []
            var count = []

            pack[item].forEach((line) => {
              legend.push(`${line[0]}`)
              option['series'].push(
                {
                  name: `${line[0]}`,
                  type: 'line',
                  showSymbol: false,
                  data: line[1].map(i => parseFloat(i))
                }
              )
            })

            // count.push(data.length)
            var list = [];
            for (var i = 0; i < option['series'][0]['data'].length; i++) {
              list.push(i);
            }
            option['legend']['data'] = legend
            option['xAxis']['data'] = list
            chart.setOption(option)
            chart.on('click', function(params) {
              let routeData = that.$router.resolve({path: '/logs', query:{index: params['seriesName'], process: process, kv: kv, dataIndex: params['dataIndex']}});
              window.open(routeData.href, '_blank');
            });
          })
        })
      })
    },
    clearChildDoms(id){
      var content = document.getElementById(id)
      while (content.firstChild) {
        content.removeChild(content.lastChild);
      }
    },
    go () {
      this.filterProcess = document.getElementById("process").value.split(/,/)
      this.filterKey = document.getElementById("keywords").value.split(/,/)
      this.clearChildDoms('graphs')
      this.createGraph()
    }
  }
}
</script>

<style>
body {
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

.topnav {
  overflow: hidden;
  background-color: #333;
  color: white;
}

.topnav label{
  font-size: 20px; /* Increased font size */
  padding: 10px 10px 0px 20px;
}

.topnav input{
  background-color: white;
  border: 1px solid black;
}

.topnav a{
  float: left;
  width: 200px;
  text-align: center; /* Center-align text */
  color: white; /* White text color */
  font-size: 20px; /* Increased font size */
  border: 1px solid black;
}

.topnav a:hover {
  background-color: #000; /* Add a hover color */
}

.name{
  writing-mode: tb-rl;
  background-color: #555;
  text-align: center;
  color: white;
  height: 200px;
}

div.row {
  padding: 10px 0px 0px 10px;
  width: 100%;
  display: inline-block;
  overflow-x: scroll;
  white-space: nowrap;
}

div.row div{
  display: inline-block;
  /* border-collapse: collapse;
  border-spacing: 0; */
  /* border: 1px solid black; */
}
</style>