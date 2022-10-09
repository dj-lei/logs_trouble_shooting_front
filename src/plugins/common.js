import urls from './urls'
import axios from 'axios'
import * as echarts from 'echarts'
import * as d3 from 'd3'

export default {
    getUrlParams (urlStr) {
      if (typeof urlStr == "undefined") {
        var url = decodeURI(location.search)
       } else {
        var url = "?" + urlStr.split("?")[1]
       }
       var theRequest = new Object()
       if (url.indexOf("?") != -1) {
        var str = url.substr(1)
        var strs = str.split("&")
        for (var i = 0; i < strs.length; i++) {
          theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1])
        }
       }
       return theRequest
    },

    getTime () {
      let yy = new Date().getFullYear();
      let mm = new Date().getMonth();
      let dd = new Date().getDate();
      let hh = new Date().getHours()
      let mf = new Date().getMinutes()<10 ? '0'+new Date().getMinutes() : new Date().getMinutes();
      let ss = new Date().getSeconds()<10 ? '0'+new Date().getSeconds() : new Date().getSeconds();
      let mil = new Date().getMilliseconds()
      return yy+'-'+mm+'-'+dd+' '+hh+':'+mf+':'+ss+'.'+mil
    },

    getTimeHour (time_stamp) {
      // let yy = new Date().getFullYear();
      // let mm = new Date().getMonth()+1;
      // let dd = new Date().getDate();
      let hh = new Date(time_stamp).getHours()
      let mf = new Date(time_stamp).getMinutes()<10 ? '0'+new Date(time_stamp).getMinutes() : new Date(time_stamp).getMinutes();
      let ss = new Date(time_stamp).getSeconds()<10 ? '0'+new Date(time_stamp).getSeconds() : new Date(time_stamp).getSeconds();
      let mil = new Date().getMilliseconds()
      return hh+':'+mf+':'+ss+'.'+mil
    },

    colorRGBtoHex(color) {
      var rgb = color.split(',')
      var r = parseInt(rgb[0].split('(')[1])
      var g = parseInt(rgb[1])
      var b = parseInt(rgb[2].split(')')[0])
      var hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
      return hex
    },

    setBrowserTitle(val){
      document.title = val
    },

    generateUUID() {
      var d = new Date().getTime()
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0
        d = Math.floor(d/16)
        return (c=='x' ? r : (r&0x3|0x8)).toString(16)
      })
      return 'a'+uuid
    },

    normalize(numbers, range){
      var res = []
      var ratio = Math.max.apply(Math, numbers) / range
      var l = numbers.length

      for (var i = 0; i < l; i++) {
        res.push([numbers[i] / ratio, numbers[i]])
      }
      return res
    },

    setChartDartTheme(echarts){
      var contrastColor = '#eee';
      var axisCommon = function () {
          return {
              axisLine: {
                  lineStyle: {
                      color: contrastColor
                  }
              },
              axisTick: {
                  lineStyle: {
                      color: contrastColor
                  }
              },
              axisLabel: {
                  textStyle: {
                      color: contrastColor
                  }
              },
              splitLine: {
                  lineStyle: {
                      type: 'dashed',
                      color: '#aaa'
                  }
              },
              splitArea: {
                  areaStyle: {
                      color: contrastColor
                  }
              }
          };
      };
  
      var colorPalette = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42'];
      var theme = {
          color: colorPalette,
          backgroundColor: '#333',
          tooltip: {
              axisPointer: {
                  lineStyle: {
                      color: contrastColor
                  },
                  crossStyle: {
                      color: contrastColor
                  }
              }
          },
          legend: {
              textStyle: {
                  color: contrastColor
              }
          },
          textStyle: {
              color: contrastColor
          },
          title: {
              textStyle: {
                  color: contrastColor
              }
          },
          toolbox: {
              iconStyle: {
                  normal: {
                      borderColor: contrastColor
                  }
              }
          },
          dataZoom: {
              textStyle: {
                  color: contrastColor
              }
          },
          timeline: {
              lineStyle: {
                  color: contrastColor
              },
              itemStyle: {
                  normal: {
                      color: colorPalette[1]
                  }
              },
              label: {
                  normal: {
                      textStyle: {
                          color: contrastColor
                      }
                  }
              },
              controlStyle: {
                  normal: {
                      color: contrastColor,
                      borderColor: contrastColor
                  }
              }
          },
          timeAxis: axisCommon(),
          logAxis: axisCommon(),
          valueAxis: axisCommon(),
          categoryAxis: axisCommon(),
          line: {
              symbol: 'circle',
          },
          graph: {
              color: colorPalette
          },
          gauge: {
              title: {
                  textStyle: {
                      color: contrastColor
                  }
              }
          },
          candlestick: {
              itemStyle: {
                  normal: {
                      color: '#FD1050',
                      color0: '#0CF49B',
                      borderColor: '#FD1050',
                      borderColor0: '#0CF49B'
                  }
              }
          }
      };
      theme.categoryAxis.splitLine.show = false;
      echarts.registerTheme('dark', theme);
    },

    getChartConfig(){
      return {
        title: {
          text: 'Stacked Line'
        },
        // backgroundColor:'#3F3F3F',
        toolbox:{
          feature:{
          }
        },
        tooltip: {
          trigger: 'axis',
          show: true,
          layout: 'vertical',
          formatter: (params) => {
            var ret = ''
            params.forEach((param) => {
              if(param['seriesName'] != 'highlight'){
                ret = ret + param.marker + param.seriesName +"  value:" + param.data['origin'] + '<br/>'
              }
            })
            return ret;
            
          },
          // feature: {
          //   saveAsImage: {
          //     show: true,
          //     excludeComponents: ['toolbox'],
          //     pixelRatio: 2
          //   }
          // }
        },
        legend: {
          data: [],
          itemWidth:12,
          itemHeight:12,
          left:'20%',
          // type: 'scroll',
          // orient: "vertical",
          textStyle: {
            fontSize: '10',
          },
        },
        xAxis: {
          // type: 'category',
          axisLabel: {
            textStyle:{
              fontSize: "10"
            },
          },
          data: []
        },
        yAxis: {
          axisLabel: {
            textStyle:{
              fontSize: "10"
            },
          },
        },
        dataZoom: [
          {
            type: 'inside',
            throttle: 50,
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 20
          }
        ],
        series: []
      }
    },

    createTreeSvg(data, svg, filterData, isAllOpen){
      let that = this
      if (Object.keys(data).length == 0) {
        return
      }
      const width = 1600
      const dx = 10
      const dy = width / 6
      const margin = ({top: 10, right: 120, bottom: 10, left: 40})

      const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
      const root = d3.hierarchy(data);
      const tree = d3.tree().nodeSize([dx, dy])
      
      root.x0 = dy / 2;
      root.y0 = 0;
      
      root.descendants().forEach((d, i) => {
        var name = [d.data.name.replace("(","").replace(")","")]
        var tmp = d
        var flag = false
        while (tmp.parent != null) {
          name.push(tmp.parent.data.name.replace("(","").replace(")",""))
          tmp = tmp.parent
        }
        var process_key_name = name.slice(0, name.length-1)
        process_key_name.reverse()
        process_key_name = process_key_name.join("__")

        name.reverse()
        d.id = name.join("__");
        d._children = d.children;
        // console.log(process_key_name)
        Object.keys(filterData).forEach((key) => {
          var tmp1 = key.split('__').slice(0, 2).join('__')
          var tmp2 = key.split('__')[0]
          if ((process_key_name == tmp1) | (process_key_name == tmp2)){
            flag = true
          }
        })
        if (!isAllOpen) {
          if (flag == false){
            if (d.depth !== 0) d.children = null;
          }
        }
      });
    
      // const svg = d3.create("svg")
      //     .attr("viewBox", [-margin.left, -margin.top, width, dx])
      //     .style("font", "10px sans-serif")
      //     .style("user-select", "none");
      const gLink = svg.append("g")
          .attr("fill", "none")
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 1.5);
    
      const gNode = svg.append("g")
          .attr("cursor", "pointer")
          .attr("pointer-events", "all");
    
      function update(source) {
        // const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const duration = 250;
        const nodes = root.descendants().reverse();
        const links = root.links();
        // Compute the new tree layout.
        tree(root);
        
        let left = root;
        let right = root;
        root.eachBefore(node => {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
        });
    
        const height = right.x - left.x + margin.top + margin.bottom;
    
        const transition = svg.transition()
            .duration(duration)
            .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
    
        // Update the nodes…
        const node = gNode.selectAll("g")
          .data(nodes, d => d.id);
    
        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (event, d) => {
              d.children = d.children ? null : d._children;
              var filterId = d.id.replace("KeyWords__", "")
              if (d._children) {
              }else{
                if (filterData.hasOwnProperty(filterId)){
                  delete filterData[filterId]
                  d3.select("#circle"+String(d.id).replace(/\./g, '_')).attr("fill", "#999")
                  d3.select("#text"+String(d.id).replace(/\./g, '_')).attr("fill", "#FFF")
                  d3.select("#text"+String(d.id).replace(/\./g, '_')).attr("stroke", "#FFF")
                }else{
                  if (d.id.includes('__bit')){
                    filterData[filterId] = [d.parent.parent.data.name, d.parent.data.name + d.data.name]
                  }else{
                    filterData[filterId] = [d.parent.data.name, d.data.name]
                  }
                  d3.select("#circle"+String(d.id).replace(/\./g, '_')).attr("fill", "#33CC00")
                  d3.select("#text"+String(d.id).replace(/\./g, '_')).attr("fill", "#33CC00")
                  d3.select("#text"+String(d.id).replace(/\./g, '_')).attr("stroke", "#33CC00")
                }
              }
              update(d);
            });
    
        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("id", d => "circle"+String(d.id).replace(/\./g, '_'))
            .attr("fill", d => {
                if (filterData.hasOwnProperty(d.id)){
                  return "#33CC00"
                }
                if (d._children){
                  return "555"
                }else{
                  return "#999"
                }
              })
            .attr("stroke-width", 10);
    
        nodeEnter.append("text")
            .attr("id", d => "text"+String(d.id).replace(/\./g, '_'))
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -6 : 6)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke-width", 0.5)
            .attr("stroke", d => {
                if (filterData.hasOwnProperty(d.id)){
                  return "#33CC00"
                }else{
                  return "white"
                }
              })
            .attr("fill", d => {
                if (filterData.hasOwnProperty(d.id)){
                  return "#33CC00"
                }else{
                  return "white"
                }
              });
    
        // Transition nodes to their new position.
        const nodeUpdate = node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
    
        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);
    
        // Update the links…
        const link = gLink.selectAll("path")
          .data(links, d => d.target.id);
    
        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
              const o = {x: source.x0, y: source.y0};
              return diagonal({source: o, target: o});
            });
    
        // Transition links to their new position.
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);
    
        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
              const o = {x: source.x, y: source.y};
              return diagonal({source: o, target: o});
            });
    
        // Stash the old positions for transition.
        root.eachBefore(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }
      update(root);
      this.syncTreeAndFilterData(svg, filterData)
    },

    syncTreeAndFilterData(svg, filterData){
      Object.keys(filterData).forEach((key) => {
        d3.select("#circle"+"KeyWords__"+key.replace(/\./g, '_')).attr("fill", "#33CC00")
        d3.select("#text"+"KeyWords__"+key.replace(/\./g, '_')).attr("fill", "#33CC00")
        d3.select("#text"+"KeyWords__"+key.replace(/\./g, '_')).attr("stroke", "#33CC00")
      })
    },

    createSequentialCompareGraph(graphs, graphHeight, graphWidth, highlightKeyword, filterData, router){
      document.getElementById("full-graph").setAttribute('style', `width:${document.body.offsetWidth}px;height:${document.body.offsetHeight}px;`)
      var ins = echarts.init(document.getElementById("full-graph"), 'dark')
      var isFullScreen = false

      var processes = Object.keys(graphs).sort()
      processes.forEach((process) => {
        var row = document.createElement("div")
        row.setAttribute('class', "row")

        var name = document.createElement("div")
        name.setAttribute('class', "name")
        name.setAttribute('style', `height:${graphHeight}px;`)
        name.innerHTML = process
        
        var graphRow = document.createElement("div")
        graphRow.setAttribute('class', "graph-row")

        row.appendChild(name)
        row.appendChild(graphRow)
        document.getElementById('graphs').appendChild(row)

        Object.keys(graphs[process]).forEach((kv) => {
          var option = this.getChartConfig()
          var pack = {}
          var categroies = []
          graphs[process][kv].forEach((item) => {
            
            item[2].forEach((data, index) => {
              if(index < item[2].length - 1){ // filter timestamp
                if (!pack.hasOwnProperty(`${index}`)){
                  pack[`${index}`] = []
                }
                if(item[4][1] == 'discrete'){
                  categroies = this.arrayDuplicates(this.arrayExtend(categroies, data)).sort()
                  option['yAxis'] = {
                      axisLabel: {
                        textStyle:{
                          fontSize: "8"
                        },
                      },
                      type: 'category', 
                      data: categroies
                    }
                  pack[`${index}`].push([item[0], data, item[3], item[2][item[2].length-1], item[4][1]])
                }else if(item[4][1] == 'register'){
                  pack[`${index}`].push([item[0], data.map((v) => (this.hex2bin(v)[31-item[4][2]])), item[3], item[2][item[2].length-1], item[4][1]])
                }else{
                  pack[`${index}`].push([item[0], data, item[3], item[2][item[2].length-1], item[4][1]])
                }
              }
            })
          })

          var items = Object.keys(pack).sort()
          items.forEach((item, index) => {
            if(index < items.length){
              var graph = document.createElement("div")
              graph.setAttribute('id', `${process}${kv}${index}`)
              graph.setAttribute('style', `width:${graphWidth}px;height:${graphHeight}px;`)
              graphRow.appendChild(graph)

              var chart = echarts.init(document.getElementById(`${process}${kv}${index}`), 'dark')
              option['title']['text'] = `${kv}_${index}`
              option['series'] = []
              option['tooltip']['formatter'] = function(params){
                var ret = ''
                params.forEach((param) => {
                  ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;value:" + param.data.value + '<br/>'
                })
                return ret;
              }
              var legend = []
              var count = []
              pack[item].forEach((line) => {
                legend.push(`${line[0]}`)
                count.push(line[1].length)
                // console.log(line[2]['data'].length > 0 ? line[2]['data'] : '')
                option['series'].push(
                  {
                    name: `${line[0]}`,
                    type: 'line',
                    showSymbol: false,
                    data: line[1].map((v, i) => ({'value': line[4] == 'discrete' ? v : parseFloat(v), 'timestamp': line[3][i]})),
                    markLine: line[2]
                  }
                )
              })

              var list = [];
              for (var i = 0; i < Math.max.apply(Math, count); i++) {
                list.push(i);
              }
              option['legend']['data'] = legend
              option['xAxis']['data'] = list
              option['toolbox']['feature'] = {
                myTool1:{
                  show:true,
                  title: 'Zoom Out',
                  icon: 'path://M395.731085 571.196755l10.18176 10.18176q4.072704 4.072704 8.145408 7.63632t8.145408 7.63632l12.218112 12.218112q20.363521 20.363521 16.290817 35.636161t-25.454401 35.636161q-9.163584 10.18176-30.036193 31.054369t-44.799745 45.308833-46.32701 46.836098-34.617985 35.636161q-18.327169 18.327169-25.454401 32.072545t6.109056 26.981665q9.163584 9.163584 23.418049 24.436225t24.436225 25.454401q17.308993 17.308993 12.7272 30.545281t-30.036193 15.27264q-26.472577 3.054528-59.05421 7.127232t-67.199618 7.63632-67.708706 7.63632-60.581474 7.127232q-26.472577 3.054528-36.654337-6.618144t-8.145408-34.108897q2.036352-25.454401 5.599968-57.017858t7.63632-64.654178 7.63632-65.672354 6.618144-60.072386q3.054528-29.527105 16.799905-37.672513t31.054369 9.163584q10.18176 10.18176 26.472577 24.945313t27.490753 25.963489 21.381697 7.127232 23.418049-16.290817q13.236288-13.236288 36.145249-36.654337t47.854274-48.363362 48.363362-48.87245 37.672513-38.181601q6.109056-6.109056 13.745376-11.709024t16.799905-7.63632 18.836257 1.018176 20.872609 13.236288zM910.928158 58.036034q26.472577-3.054528 36.654337 6.618144t8.145408 34.108897q-2.036352 25.454401-5.599968 57.017858t-7.63632 64.654178-7.63632 66.181442-6.618144 60.581474q-3.054528 29.527105-16.799905 37.163425t-31.054369-9.672672q-10.18176-10.18176-27.999841-26.472577t-29.018017-27.490753-19.345345-9.672672-20.363521 13.745376q-14.254464 14.254464-37.163425 37.672513t-48.363362 49.381538-49.890626 50.399714l-37.672513 37.672513q-6.109056 6.109056-13.236288 12.218112t-15.781729 9.163584-18.327169 1.018176-19.854433-13.236288l-38.690689-38.690689q-20.363521-20.363521-17.818081-37.163425t22.908961-37.163425q9.163584-9.163584 30.545281-31.054369t45.817921-46.32701 47.345186-47.854274 36.145249-35.636161q18.327169-18.327169 22.908961-30.036193t-8.654496-24.945313q-9.163584-9.163584-21.890785-22.399873t-22.908961-23.418049q-17.308993-17.308993-12.7272-30.545281t30.036193-16.290817 58.545122-7.127232 67.708706-7.63632 67.708706-7.63632 60.581474-7.127232z',
                  onclick: (e) =>{
                    if(isFullScreen == false){
                      let props = echarts.getInstanceByDom(document.getElementById(`${process}${kv}${index}`))
                      ins.setOption(props.getOption())
  
                      ins.on('click', function(params) {
                        if(params['componentType'] != 'markLine'){
                          let routeData = router.resolve({path: '/logicview', query:{index: params['seriesName'], process: process, kv: kv, dataIndex: params['dataIndex'], highlightKeyword:JSON.stringify(highlightKeyword), filterData:JSON.stringify(filterData)}});
                          window.open(routeData.href, '_blank');
                        }
                      })
                      
                      isFullScreen = true
                      var modal = document.getElementById("full-graph-modal")
                      modal.style.display = "block"
                    }else{
                      isFullScreen = false
                      var modal = document.getElementById("full-graph-modal")
                      modal.style.display = "none"
                    }

                  }
                },
              }
              chart.setOption(option)
              chart.on('click', function(params) {
                if(params['componentType'] != 'markLine'){
                  let routeData = router.resolve({path: '/logicview', query:{index: params['seriesName'], process: process, kv: kv, dataIndex: params['dataIndex'], highlightKeyword:JSON.stringify(highlightKeyword), filterData:JSON.stringify(filterData)}});
                  window.open(routeData.href, '_blank');
                }
              })
            }
          })
        })
      })
    },

    createStatisticsCompareGraph(graphs, bisection){
      var res = {}
      Object.keys(graphs).forEach((process) => {
        Object.keys(graphs[process]).forEach((kv) => {
          var items = graphs[process][kv]
          items.forEach((item) => {
            item[2].forEach((data, index) => {
              if(index < item[2].length - 1){
                var key = `${kv}.${index}`
                if (!res.hasOwnProperty(item[0])){
                  res[item[0]] = {}
                }
  
                if (!res[item[0]].hasOwnProperty(key)){
                  res[item[0]][key] = {}
                }
      
                if (!res[item[0]][key].hasOwnProperty(process)){
                  var statistics = {}
                  var count = data.length
                  if(key.includes('(c)')){ 
                    var tmp = data.map((v) => parseFloat(v))
                    var max = Math.max.apply(Math, tmp)
                    var min = Math.min.apply(Math, tmp)
                    var interval = (max - min) / bisection
                    var elms = [...Array(bisection * 2).keys()]
                    elms.forEach((v) => {
                      statistics[v] = 0
                    })
                    tmp.map((v) => {
                      if (parseInt((v-min)/interval) == bisection) {
                        var k = (parseInt((v-min)/interval) - 1) * 2
                        statistics[k] = statistics[k] + 1
                      }else{
                        var k = parseInt((v-min)/interval) * 2 + 1
                        statistics[k] = statistics[k] + 1
                      }
                    })
                  }else if(key.includes('(r)')){
                    [0,1].forEach((v) => {
                      statistics[v] = 0
                    })
                    var bit = parseInt(key.split('(r)')[1].replace('_bit', '') )
                    data.map((v) => {
                      statistics[parseInt(this.hex2bin(v)[31-bit])] = statistics[parseInt(this.hex2bin(v)[31-bit])] + 1
                    })
                  }else{
                    this.arrayDuplicates(data).forEach((v) => {
                      statistics[v] = 0
                    })
                    data.map((v) => {
                      statistics[v] = statistics[v] + 1
                    })
                  }
                  var tmp2 = {}
                  Object.keys(statistics).forEach((k) => {
                    var rate = (statistics[k] / count)
                    if(key.includes('(c)')){
                      var range = `${parseInt(k/2*interval) + min - interval/2}--${parseInt(k/2*interval) + min + interval/2}`
                      tmp2[parseInt(k/2*interval) + min] = `count=${statistics[k]};rate=${rate.toFixed(2)};range=${range}`
                    }else{
                      tmp2[k] = `count=${statistics[k]};rate=${rate.toFixed(2)}`
                    }
                  })
                  res[item[0]][key][process] = tmp2
                }
              }
            })
          })
        })
      })
      Object.keys(res).forEach((logIndex) => {
        var row = document.createElement("div")
        row.setAttribute('class', "row")
        var name = document.createElement("div")
        name.setAttribute('class', "name")
        name.setAttribute('style', `height:${document.body.offsetHeight}px;`)
        name.innerHTML = logIndex
        
        var graphRow = document.createElement("div")
        graphRow.setAttribute('class', "graph-row")

        row.appendChild(name)
        row.appendChild(graphRow)
        document.getElementById('graphs').appendChild(row)

        Object.keys(res[logIndex]).forEach((key) => {
          const title = [];
          const singleAxis = [];
          const series = [];
          Object.keys(res[logIndex][key]).forEach((process, idx) => {
            title.push({
              textBaseline: 'middle',
              top: ((idx + 0.5) * 100) / 7 + '%',
              text: process+'/'+key
            });
            singleAxis.push({
              left: 150,
              type: 'category',
              boundaryGap: false,
              data: Object.keys(res[logIndex][key][process]),
              top: (idx * 100) / 7 + 5 + '%',
              height: 100 / 7 - 10 + '%',
              axisLabel: {
                interval: 1
              }
            });
            series.push({
              singleAxisIndex: idx,
              coordinateSystem: 'singleAxis',
              type: 'scatter',
              data: Object.keys(res[logIndex][key][process]).map((v) => {
                return res[logIndex][key][process][v]
              }),
              symbolSize: function (dataItem) {
                return parseFloat(dataItem.split(';')[1].split('=')[1]) * 100;
              }
            })
            
          })
          // console.log(title, singleAxis, series)
          var option = {
            tooltip: {
              position: 'top'
            },
            title: title,
            singleAxis: singleAxis,
            series: series
          };
          var graph = document.createElement("div")
          graph.setAttribute('id', `${logIndex}${key}`)
          graph.setAttribute('style', `width:1200px;height:${document.body.offsetHeight-70}px;`)
          graphRow.appendChild(graph)

          var chart = echarts.init(document.getElementById(`${logIndex}${key}`), 'dark')
          chart.setOption(option)
        })
      })
    },

    zip(x, y){
      return Array(Math.max(x.length, y.length)).fill().map((_,i) => [x[i], y[i]]);
    },

    removeAllChildDom(id){
      var divGraphs = document.getElementById(id)
      while (divGraphs.firstChild) {
        divGraphs.removeChild(divGraphs.lastChild)
      }
    },

    arrayRemoveElm(list, elm){
      const index = list.indexOf(elm);
      if (index > -1) { // only splice array when item is found
        list.splice(index, 1); // 2nd parameter means remove one item only
      }
    },

    arrayIntersection(a, b){
      return a.filter(value => b.includes(value))
    },

    arrayDuplicates(a){
      return Array.from(new Set(a))
    },

    arrayExtend(a, b){
      Array.prototype.push.apply(a,b)
      return a
    },

    clone(obj) {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
    },

    hex2bin(hex){
      var res = (parseInt(hex, 16).toString(2)).padStart(8, '0')
      if (res.length < 32){
        var tmp = 32 - res.length
        for(var i=0;i<tmp;i++){
          res = '0' + res 
        }
      }
      return res;
    },

    invertedIndexTableQuery(invertedIndexTable, processOriginIndex, kvOriginIndex, highlightKeyword){
      var res = {
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
      
      Object.keys(highlightKeyword).forEach((item) => {
        item.split(/,/).forEach((key) => {
          if (invertedIndexTable.hasOwnProperty(key.toLowerCase()))
          {
            
            var intersec = this.arrayIntersection(invertedIndexTable[key.toLowerCase()]['x'], processOriginIndex)
            if (intersec.length > 0){
              intersec.forEach((elm) => {
                var pos = d3.bisect(kvOriginIndex, parseInt(elm));
                if(pos < kvOriginIndex.length - 1){
                  res['data'].push({xAxis: pos,label: {color: highlightKeyword[item], formatter:key,fontSize:10}})
                  // res['data'].push({xAxis: pos,label: {formatter:key,fontSize:10}})
                }
              })
              
            }
          }
        })
      })
      return res
    },

    generateKeyWordsTree(data){
      var res = {'name': 'KeyWords'}
      var processes = []
      Object.keys(data).forEach((process) => {
        var keywords = []
        Object.keys(data[process]).forEach((keyword) => {
          if (keyword.includes('(r)')) {
            var bits = []
            for(var i=0; i < 32; i++ ){
              bits.push({'name': 'bit'+String(i)})
            }
            keywords.push({'name':keyword, 'children': bits})
          }else if (keyword.includes('(d)')){
            keywords.push({'name':keyword, 'value': 'discrete'})
          }else{
            keywords.push({'name':keyword, 'value': 'continuous'})
          }
        })
        processes.push({'name': process, 'children': keywords})
      })
      res['children'] = processes
      return res
    },

    generateFilterKeyWordsTree(data){
      var res = {'name': 'KeyWords'}
      var keywords = []
      Object.keys(data).forEach((keyword) => {
        if (keyword.includes('(r)')) {
          var bits = []
          for(var i=0; i < 32; i++ ){
            bits.push({'name': 'bit'+String(i)})
          }
          keywords.push({'name':keyword, 'children': bits})
        }else if (keyword.includes('(d)')){
          keywords.push({'name':keyword, 'value': 'discrete'})
        }else{
          keywords.push({'name':keyword, 'value': 'continuous'})
        }
      })
      res['children'] = keywords
      return res
    },

    exportConfig(filterData, highlightKeyword){
      var res = {}
      res['filterData'] = filterData
      res['highlightKeyword'] = highlightKeyword
      this.exportJosnToLocalTxt(res, 'config.txt')
    },

    loadConfig(){
      document.getElementById('fileInput').click()
    },

    exportJosnToLocalTxt(content, fileName){
      var a = document.createElement("a");
      var file = new Blob([JSON.stringify(content)], {type: 'text/plain'});
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
    },

    startLoading(){
      var loadingOverlay = document.querySelector('.loading');
      loadingOverlay.classList.remove('hidden');
    },
    
    stopLoading(){
      var loadingOverlay = document.querySelector('.loading');
      loadingOverlay.classList.add('hidden');
    },
}

