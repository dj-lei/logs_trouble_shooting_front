import urls from './urls'
import axios from 'axios'
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

    getTime (time_stamp) {
      let yy = new Date().getFullYear();
      let mm = new Date().getMonth()+1;
      let dd = new Date().getDate();
      let hh = new Date().getHours()
      let mf = new Date().getMinutes()<10 ? '0'+new Date().getMinutes() : new Date().getMinutes();
      let ss = new Date().getSeconds()<10 ? '0'+new Date().getSeconds() : new Date().getSeconds();
      return yy+'-'+mm+'-'+dd+' '+hh+':'+mf+':'+ss
    },

    getTimeHour (time_stamp) {
      // let yy = new Date().getFullYear();
      // let mm = new Date().getMonth()+1;
      // let dd = new Date().getDate();
      let hh = new Date(time_stamp).getHours()
      let mf = new Date(time_stamp).getMinutes()<10 ? '0'+new Date(time_stamp).getMinutes() : new Date(time_stamp).getMinutes();
      let ss = new Date(time_stamp).getSeconds()<10 ? '0'+new Date(time_stamp).getSeconds() : new Date(time_stamp).getSeconds();
      return hh+':'+mf+':'+ss
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
        tooltip: {
          trigger: 'axis',
          show: true,
          layout: 'vertical',
          formatter: (params) => {
            var ret = ''
            params.forEach((param) => {
              if(param['seriesName'] != 'highlight'){
                ret = ret + param.marker + param.seriesName +"--" + param.data['origin'] + '<br/>'
              }
            })
            return ret;
            
          },
          feature: {
            saveAsImage: {
              show: true,
              excludeComponents: ['toolbox'],
              pixelRatio: 2
            }
          }
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
          data: []
        },
        yAxis: {},
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

    getTreeChartConfig(data){
      return {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove'
        },
        series: [
          {
            type: 'tree',
            data: [data],
            // top: '10%',
            left: '8%',
            // bottom: '22%',
            right: '20%',
            edgeShape: 'polyline',
            edgeForkPosition: '63%',
            symbol: 'emptyCircle',
            orient: 'vertical',
            initialTreeDepth: 2,
            label: {
              position: 'top',
              rotate: -45,
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 10
            },
            leaves: {
              label: {
                position: 'bottom',
                rotate: -45,
                verticalAlign: 'middle',
                align: 'left'
              }
            },
            emphasis: {
              focus: 'descendant'
            },
            expandAndCollapse: true,
            animationDuration: 550,
            animationDurationUpdate: 750
          }
        ]
      }
    },

    createTreeSvg(data, svg, filterData){
      let that = this
      const root = d3.hierarchy(data);
      const dx = 10
      const dy = 192
      const width = 1600
      root.x0 = dy / 2;
      root.y0 = 0;

      const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
      const tree = d3.tree().nodeSize([dx, dy])
      const margin = ({top: 10, right: 120, bottom: 10, left: 40})

      root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
        if (d.depth && d.data.name.length !== 7) d.children = null;
      });
    
      // const svg = d3.create("svg")
      //     .attr("viewBox", [-margin.left, -margin.top, width, dx])
      //     .style("font", "10px sans-serif")
      //     .style("user-select", "none");
    
      const gLink = svg.append("g")
          .attr("fill", "none")
          .attr("stroke", "#555")
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
              if (d._children) {
              }else{
                if (filterData.hasOwnProperty(d.id)){
                  delete filterData[d.id]
                  d3.select("#circle"+String(d.id)).attr("fill", "#999")
                  d3.select("#text"+String(d.id)).attr("stroke", "black")
                }else{
                  if (d.depth == 4){
                    filterData[d.id] = [d.parent.parent.data.name, d.parent.data.name + d.data.name]
                  }else{
                    filterData[d.id] = [d.parent.data.name, d.data.name]
                  }
                  d3.select("#circle"+String(d.id)).attr("fill", "#33CC00")
                  d3.select("#text"+String(d.id)).attr("stroke", "#33CC00")
                }
              }
              // console.log(d)
              update(d);
            });
    
        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("id", d => "circle"+String(d.id))
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
            .attr("id", d => "text"+String(d.id))
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -6 : 6)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke-width", 0.5)
            .attr("stroke", d => {
                if (filterData.hasOwnProperty(d.id)){
                  return "#33CC00"
                }else{
                  return "black"
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

    invertedIndexTableQuery(invertedIndexTable, processOriginIndex, kvOriginIndex, highlightKeyword){
      var res = {
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
            
            var intersec = this.arrayIntersection(invertedIndexTable[key]['x'], processOriginIndex)
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

    generateKeyWordsTree(data, keyWordsType){
      var res = {'name': 'KeyWords'}
      var indices = []
      Object.keys(data).forEach((index) => {
        // res['children'].push({'name':index, 'children': []})
        var devs = []
        Object.keys(data[index]).forEach((dev) => {
          var processes = []
          Object.keys(data[index][dev]).forEach((process) => {
            var keywords = []
            Object.keys(data[index][dev][process]).forEach((keyword) => {
              if (keyWordsType[index][dev][process][keyword] == 'register') {
                var bits = []
                for(var i=0; i < 32; i++ ){
                  bits.push({'name': 'bit'+String(i)})
                }
                keywords.push({'name':keyword+'(r)', 'children': bits})
              }else if (keyWordsType[index][dev][process][keyword] == 'discrete'){
                keywords.push({'name':keyword+'(d)', 'value': keyWordsType[index][dev][process][keyword]})
              }else{
                keywords.push({'name':keyword+'(c)', 'value': keyWordsType[index][dev][process][keyword]})
              }
            })
            processes.push({'name': process, 'children': keywords})
          })
          indices.push({'name': index, 'children': processes})
        })
        // indices.push({'name': index, 'children': devs})
      })
      res['children'] = indices
      return res
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

