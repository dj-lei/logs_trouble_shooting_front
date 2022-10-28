const axios = require('axios')
import * as d3 from "d3"
import * as echarts from 'echarts'
import urls from '@/plugins/urls'
import service from '@/plugins/http'


class KnowledgeNetworkEditView
{
    constructor(){
        this.ins = ''
        this.num = 1
        this.activeCanvas = ''
        this.containerCanvas = {}
    }

    init(ins)
    {
        this.ins = ins
        var divContainerCanvas = document.createElement('div')
        divContainerCanvas.setAttribute('id', 'container-canvas')
        var divBottomNav = document.createElement('div')
        divBottomNav.setAttribute('id', 'bottom-nav')
        var upload = document.createElement('input')
        upload.setAttribute('id', 'svgUpload')
        upload.setAttribute('type', 'file')
        upload.style.display = 'none'
    
        var screen = document.getElementById('screen')
        screen.append(divContainerCanvas)
        screen.append(divBottomNav)
        screen.append(upload)
    
        this.addRunButton()
        this.addAnchorApiButton()
        this.addAnchorJumpButton()
        this.addUploadButton()
        this.addAddCanvasButton()

        var canvas = new Canvas('Canvas1', this.ins)
        this.containerCanvas['Canvas1'] = canvas
        canvas.init(canvas)
        this.addCanvasButton('Canvas1')
        document.getElementById("Canvas1-nav").click()
    }

    addCanvasButton(name)
    {
        let that = this
        var tablink = document.createElement('button')
        tablink.setAttribute('id', name+'-'+'nav')
        tablink.style.backgroundColor = '#555'
        tablink.style.color = 'white'
        tablink.style.float = 'left'
        tablink.style.border = '1px solid rgb(0, 0, 0)'
        tablink.style.cursor = 'pointer'
        tablink.style.padding = '14px 16px'
        tablink.style.fontSize = '17px'
        tablink.style.width = '10%'
        tablink.className = "tablink"
        tablink.innerHTML = name
        tablink.addEventListener('click', function()
        {
            that.openCanvas(name+'-content', tablink)
        })
        document.getElementById('bottom-nav').appendChild(tablink)
    }

    addUploadButton()
    {
        let that = this
        var upload = document.createElement('button')
        upload.style.backgroundColor = '#555'
        upload.style.color = 'white'
        upload.style.float = 'left'
        upload.style.border = '1px solid rgb(0, 0, 0)'
        upload.style.cursor = 'pointer'
        upload.style.padding = '14px 16px'
        upload.style.fontSize = '17px'
        upload.style.width = '5%'
        upload.innerHTML = 'UPLOAD'
        upload.addEventListener('click', function()
        {
            document.getElementById('svgUpload').click()
        })
        document.getElementById('svgUpload').onchange = function (event) {
            var file = document.getElementById("svgUpload").files[0]
            that.containerCanvas[that.activeCanvas].insertSymbol(file)
        }
        document.getElementById('bottom-nav').appendChild(upload)
    }

    addAnchorApiButton()
    {
        let that = this
        var anchor = document.createElement('button')
        anchor.style.backgroundColor = '#555'
        anchor.style.color = 'white'
        anchor.style.float = 'left'
        anchor.style.border = '1px solid rgb(0, 0, 0)'
        anchor.style.cursor = 'pointer'
        anchor.style.padding = '14px 16px'
        anchor.style.fontSize = '17px'
        anchor.style.width = '5%'
        anchor.innerHTML = 'ANCHOR API'
        anchor.addEventListener('click', function()
        {
            that.containerCanvas[that.activeCanvas].insertAnchorApi()
        })
        document.getElementById('bottom-nav').appendChild(anchor)
    }

    addAnchorJumpButton()
    {
        let that = this
        var anchor = document.createElement('button')
        anchor.style.backgroundColor = '#555'
        anchor.style.color = 'white'
        anchor.style.float = 'left'
        anchor.style.border = '1px solid rgb(0, 0, 0)'
        anchor.style.cursor = 'pointer'
        anchor.style.padding = '14px 16px'
        anchor.style.fontSize = '17px'
        anchor.style.width = '5%'
        anchor.innerHTML = 'ANCHOR JUMP'
        anchor.addEventListener('click', function()
        {
            that.containerCanvas[that.activeCanvas].insertAnchorJump()
        })
        document.getElementById('bottom-nav').appendChild(anchor)
    }

    addRunButton()
    {
        let that = this
        var run = document.createElement('button')
        run.style.backgroundColor = '#555'
        run.style.color = 'white'
        run.style.float = 'left'
        run.style.border = '1px solid rgb(0, 0, 0)'
        run.style.cursor = 'pointer'
        run.style.padding = '14px 16px'
        run.style.fontSize = '17px'
        run.style.width = '5%'
        run.innerHTML = 'RUN'
        run.addEventListener('click', function()
        {
            if(run.innerHTML == 'RUN'){
                run.innerHTML = 'STOP'
                that.containerCanvas[that.activeCanvas].runRefreshAnchor()
            }else{
                run.innerHTML = 'RUN'
                that.containerCanvas[that.activeCanvas].stopRefreshAnchor()
            }
        })
        document.getElementById('bottom-nav').appendChild(run)
    }

    addAddCanvasButton()
    {
        let that = this
        var add = document.createElement('button')
        add.style.backgroundColor = '#555'
        add.style.color = 'white'
        add.style.float = 'right'
        add.style.border = '1px solid rgb(0, 0, 0)'
        add.style.cursor = 'pointer'
        add.style.padding = '14px 16px'
        add.style.fontSize = '17px'
        add.style.width = '5%'
        add.innerHTML = '+'
        add.addEventListener('click', function()
        {
            that.num = that.num + 1
            var canvas = new Canvas(`Canvas${that.num}`, that.ins)
            that.containerCanvas[`Canvas${that.num}`] = canvas
            canvas.init(canvas)
            that.addCanvasButton(`Canvas${that.num}`)
            document.getElementById(`Canvas${that.num}-nav`).click()
        })
        document.getElementById('bottom-nav').appendChild(add)
    }

    openCanvas(name, element)
    {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "#555";
        }
        document.getElementById(name).style.display = "block";
        element.style.backgroundColor = "#333";
        this.activeCanvas = name.replace('-content', '')
    }
}


class Canvas
{
    constructor(name, parent){
        this.parent = parent
        this.ins = ''
        this.name = name
        this.svg = ''
        this.tooltip = ''
        this.transform = {}
        this.containerSymbol = []
        this.containerAnchor = []
    }

    init(ins)
    {
        this.ins = ins
        var tabcontent = document.createElement('div')
        tabcontent.setAttribute('id', this.name+'-content')
        tabcontent.style.width = '100%'
        tabcontent.className = "tabcontent"

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('id', this.name)
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', document.body.offsetHeight - 50)

        var tooltip = document.createElement('div')
        tooltip.setAttribute('id', this.name+'-tooltip')

        tabcontent.appendChild(svg)
        tabcontent.appendChild(tooltip)

        document.getElementById('container-canvas').appendChild(tabcontent)
        this.resetCoordinates()

        this.svg = d3.select(`#${this.name}`).append("g")
            .attr("id", "canvas")
            .style("font", "8px sans-serif")

        this.tooltip = d3.select(`#${this.name}-tooltip`).call(this.createTooltip)
    }

    createTooltip(el) {
        el
        .style("position", "absolute")
        .style("top", 0)
        .style("opacity", 0)
        .style("background", "white")
        .style("border-radius", "5px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
        .style("padding", "10px")
        .style("line-height", "1.3")
        .style("font", "11px sans-serif")
        // .style("cursor", 'pointer')
    }

    resetCoordinates()
    {
        let that = this
        var zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", zoomed)
        d3.select(`#${this.name}`).call(zoom).on("dblclick.zoom", null)

        function zoomed(event){
            const {transform} = event
            that.transform = transform
            that.svg.attr("transform", transform)
            // that.refreshSymbol()
        }
    }

    refreshSymbol()
    {
        this.containerSymbol.forEach((symbol) => {
            symbol.isShowChildCanvas(this.transform)
        })
    }

    runRefreshAnchor()
    {
        this.containerAnchor.forEach((anchor) => {
            anchor.run()
        })
    }

    stopRefreshAnchor()
    {
        this.containerAnchor.forEach((anchor) => {
            anchor.stop()
        })
    }

    insertSymbol(file)
    {
        let that = this

        var fileName = file.name.split('.')[0]
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = ()=>{
            d3.xml(reader.result)
            .then(data => {
                var symbol = new Symbol(data.documentElement, fileName, that.ins)
                that.containerSymbol.push(symbol)
            })
        }
    }

    insertAnchorApi()
    {
        this.containerAnchor.push(new AnchorApi(this.ins))
    }

    insertAnchorJump()
    {
        new AnchorJump(this.ins)
    }
}


class Symbol
{
    constructor(documentElement, name, parent){
        this.parent = parent
        // this.ins = ''
        this.svg = ''
        this.box = ''
        this.drag = ''
        this.zoomRate = 1
        this.childCanvas = 'Canvas2'
        this.childContainerSymbol = []
        this.mouse_position = {'x': 0, 'y': 0}
        this.initDrag()
        this.init(documentElement, name)
    }

    init(documentElement, name){
        this.svg = this.parent.svg.append("g")
            .attr("id", name)
            .attr("class", 'symbol')

        this.svg.node().append(documentElement)
        this.svg.call(this.drag)
        this.box = this.svg.node().getBBox()
    }

    initDrag(){
        let that = this
        function dragstarted(event) {
            that.mouse_position = {'x': event.x, 'y': event.y}
        }
        function dragged(event) {
            d3.select(this).attr("transform", `translate(${event.x - that.mouse_position.x}, ${event.y - that.mouse_position.y})`)
        }
        function dragended(event) {
        }
        this.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    show(){
        this.svg.style('visibility', 'visible')
    }

    hidden(){
        this.svg.style('visibility', 'hidden')
    }

    showChildren(){
        // has ins?
        let that = this
        if(this.childContainerSymbol.length == 0){
            d3.select(`#${this.childCanvas}`).select("#canvas").selectAll(".symbol").each(function(d, i) {
                that.childContainerSymbol.push(new Symbol(d3.select(this).node(), d3.select(this).attr('id'), that.parent))
            })
        }else{
            for(var i=0; i < this.childContainerSymbol.length; i++)
            {
                this.childContainerSymbol[i].svg.style('visibility', 'visible')
            }
        }
    }

    hiddenChildren(){
        for(var i=0; i < this.childContainerSymbol.length; i++)
        {
            this.childContainerSymbol[i].svg.style('visibility', 'hidden')
        }
    }

    isShowChildCanvas(transform){
        var k = transform.k * this.zoomRate
        if ((k * this.box.width > document.body.offsetWidth * 0.8) | (k * this.box.height > document.body.offsetHeight * 0.8))
        {
            this.hidden()
            this.showChildren()
        }else{
            this.show()
            this.hiddenChildren()
        }
        // console.log(d3.select(`#TEST1`).select("#canvas").node())
    }
}


class AnchorApi
{
    constructor(parent){
        this.parent = parent
        // this.name = name
        this.ins = ''
        this.svg = ''
        this.drag = ''
        this.refresh_interval = 1000
        this.run_ins = ''
        this.history_data_pool = []
        this.config = null
        this.mouse_position = {'x': 0, 'y': 0}
        this.initDrag()
        this.init()
    }

    init()
    {
        let that = this
        this.svg = this.parent.svg.append("g")
            // .attr("id", this.name)
            .attr("class", 'anchor')

        this.svg.append("circle")
            .style("stroke", "gray")
            .style("fill", "red")
            .attr("r", 10)
            .attr("cx", 10)
            .attr("cy", 10)
            .on("click", function(event) {
                that.openDialog()
            })
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke", "white")
            })
            .on("mouseleave", function(event, d) {
                d3.select(this).style("stroke", "gray")
            })

        this.svg.call(this.drag)
    }

    initDrag(){
        let that = this
        function dragstarted(event) {
            that.mouse_position = {'x': event.x, 'y': event.y}
        }
        function dragged(event) {
            d3.select(this).attr("transform", `translate(${event.x - that.mouse_position.x}, ${event.y - that.mouse_position.y})`)
        }
        function dragended(event) {
        }
        this.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    openDialog(){
        if(this.config == null){
            this.config = new DialogAnchorApi()
        }
        this.config.open()
    }

    async run(){
        let that = this

        this.svg.append("foreignObject")
            .attr("transform", `translate(0, -210)`)
            .attr("class", "tip")
            .attr("width", 300)
            .attr("height", 200)
            .html('<div class="children" style="background:white;width: 300px;height:200px;" >')

        this.run_ins = setInterval(function() {
            service.get(urls.get_random, {
                params: {
                    cmd: that.config.cmd,
                    regex: that.config.regex
                },
                })
                .then(response => {
                    let series = []
                    let names = []
                    let tmp = []
                    let key = that.config.desc

                    that.history_data_pool.push(response.data.content[0])
                    tmp = that.sliceYAxisQueueHandle(that.history_data_pool, 30)
                    series.push({'name':key, 'type':'line', 'showSymbol':false, 'data':tmp})
                    names.push(key)

                    let ins = echarts.getInstanceByDom(that.svg.select('foreignObject').select('div').node())
                    if (ins == null){
                      echarts.init(that.svg.select('foreignObject').select('div').node()).setOption(that.getChartConfig(names, series, that.sliceXAxisQueueHandle(that.refresh_interval, 30)))
                    }else{
                      ins.setOption(that.getChartConfig(names, series, that.sliceXAxisQueueHandle(that.refresh_interval, 30)), true)
                    }
                })
        }, this.refresh_interval)
    }

    stop(){
        clearInterval(this.run_ins)
        setTimeout(() =>{
            this.svg.selectAll('.tip').remove()
        }, 1000)
    }

    sliceYAxisQueueHandle(data, slice_num){
        if(data.length < slice_num){
            return new Array(slice_num-data.length).fill(0).concat(data)
        }else{
            return data.slice(data.length - slice_num, data.length)
        }
    }
  
    sliceXAxisQueueHandle(refresh_interval, slice_num){
        let tmp = []
        let cur_time = Date.parse(new Date())
        for(let i=0;i<slice_num;i++){
            tmp.push(this.getTimeHour(cur_time - (slice_num-i)*refresh_interval))
        }
        return tmp
    }

    getChartConfig(names, data, xaxis){
        return {
            title: {
                text: 'chart'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: names
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    saveAsImage: {}
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xaxis
            },
            yAxis: {
                type: 'value',
            },
            series: data
        }
    }

    getTimeHour (time_stamp) {
        let hh = new Date(time_stamp).getHours()
        let mf = new Date(time_stamp).getMinutes()<10 ? '0'+new Date(time_stamp).getMinutes() : new Date(time_stamp).getMinutes();
        let ss = new Date(time_stamp).getSeconds()<10 ? '0'+new Date(time_stamp).getSeconds() : new Date(time_stamp).getSeconds();
        return hh+':'+mf+':'+ss
    }
}

class AnchorJump
{
    constructor(parent){
        this.parent = parent
        this.svg = ''
        this.drag = ''
        this.config = null
        this.mouse_position = {'x': 0, 'y': 0}
        this.initDrag()
        this.init()
    }

    init()
    {
        let that = this
        this.svg = this.parent.svg.append("g")
            // .attr("id", this.name)
            .attr("class", 'anchor')

        this.svg.append("circle")
            .style("stroke", "gray")
            .style("fill", "yellow")
            .attr("r", 10)
            .attr("cx", 10)
            .attr("cy", 10)
            .on("click", function(event) {
                that.openDialog()
            })
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke", "white")
                if(that.config != null){
                    that.parent.tooltip
                    .style("margin-left", `${event.x}px`)
                    .style("margin-top", `${event.y-60}px`)
                    .style("opacity", 1)
                    .html(that.getTooltipContent(that.config.jumpCanvas))
                }
            })
            .on("mouseleave", function(event, d) {
                d3.select(this).style("stroke", "gray")
            })

        this.svg.call(this.drag)
    }

    initDrag(){
        let that = this
        function dragstarted(event) {
            that.mouse_position = {'x': event.x, 'y': event.y}
        }
        function dragged(event) {
            d3.select(this).attr("transform", `translate(${event.x - that.mouse_position.x}, ${event.y - that.mouse_position.y})`)
        }
        function dragended(event) {
        }
        this.drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    getTooltipContent(d) {
        return `<button onclick="document.getElementById('${d}-nav').click()">${d}</button>`
    }

    openDialog(){
        if(this.config == null){
            this.config = new DialogAnchorJump()
        }
        this.config.open()
    }
}

class DialogAnchorApi
{
    constructor(){
        this.modal = null
        this.desc = ''
        this.cmd = ''
        this.regex = ''
        this.descI = ''
        this.cmdI = ''
        this.regexI = ''
        this.returnI = ''
        this.init()
    }

    init(){
        let that = this

        this.modal = document.createElement('div')
        this.modal.style.display = 'none'
        this.modal.style.position = 'fixed'
        this.modal.style.zIndex = '1'
        this.modal.style.left = 0
        this.modal.style.top = 0
        this.modal.style.width = '100%'
        this.modal.style.height = '100%'
        this.modal.style.overflow = 'auto'
        this.modal.style.backgroundColor = 'rgb(0,0,0)'
        this.modal.style.backgroundColor = 'rgba(0,0,0,0.4)'
        this.modal.style.paddingTop = '60px'

        var container = document.createElement('div')
        container.style.backgroundColor = '#fefefe'
        container.style.margin = '5% auto 15% auto'
        container.style.border = '1px solid #888'
        container.style.width = '40%'

        var descL = document.createElement('label')
        descL.innerHTML = 'DESC'
        this.descI = document.createElement('input')
        this.descI.type = 'text'
        this.descI.placeholder = 'description here'
        this.descI.style.width = '100%'
        this.descI.style.padding = '12px 20px'
        this.descI.style.margin = '8px 0'
        this.descI.style.display = 'inline-block'
        this.descI.style.border = '1px solid #ccc'
        this.descI.style.boxSizing= 'border-box'

        var cmdL = document.createElement('label')
        cmdL.innerHTML = 'CMD'
        this.cmdI = document.createElement('input')
        this.cmdI.type = 'text'
        this.cmdI.placeholder = 'input cmd here'
        this.cmdI.style.width = '100%'
        this.cmdI.style.padding = '12px 20px'
        this.cmdI.style.margin = '8px 0'
        this.cmdI.style.display = 'inline-block'
        this.cmdI.style.border = '1px solid #ccc'
        this.cmdI.style.boxSizing= 'border-box'

        var regexL = document.createElement('label')
        regexL.innerHTML = 'REGEX'
        this.regexI = document.createElement('input')
        this.regexI.type = 'text'
        this.regexI.placeholder = 'input regex here'
        this.regexI.style.width = '100%'
        this.regexI.style.padding = '12px 20px'
        this.regexI.style.margin = '8px 0'
        this.regexI.style.display = 'inline-block'
        this.regexI.style.border = '1px solid #ccc'
        this.regexI.style.boxSizing= 'border-box'

        var returnL = document.createElement('label')
        returnL.innerHTML = 'RETURN'
        this.returnI = document.createElement('textarea')
        this.returnI.rows = '20'
        this.returnI.cols = '50'
        this.returnI.placeholder = 'cmd return'
        this.returnI.style.width = '100%'
        this.returnI.style.padding = '12px 20px'
        this.returnI.style.margin = '8px 0'
        this.returnI.style.display = 'inline-block'
        this.returnI.style.border = '1px solid #ccc'
        this.returnI.style.boxSizing= 'border-box'

        var apply = document.createElement('button')
        apply.type = 'submit'
        apply.innerHTML = 'APPLY'
        apply.style.backgroundColor = 'green'
        apply.style.color = 'white'
        apply.style.padding = '14px 20px'
        apply.style.margin = '8px 0'
        apply.style.border = 'none'
        apply.style.cursor = 'pointer'
        apply.style.width = '33%'
        apply.onclick = function(){that.apply()}

        var test = document.createElement('button')
        test.type = 'submit'
        test.innerHTML = 'TEST'
        test.style.backgroundColor = 'blue'
        test.style.color = 'white'
        test.style.padding = '14px 20px'
        test.style.margin = '8px 0'
        test.style.border = 'none'
        test.style.cursor = 'pointer'
        test.style.width = '33%'
        test.onclick = function(){that.test()}

        var cancel = document.createElement('button')
        cancel.innerHTML = 'CANCEL'
        cancel.style.backgroundColor = 'red'
        cancel.style.color = 'white'
        cancel.style.padding = '14px 20px'
        cancel.style.margin = '8px 0'
        cancel.style.border = 'none'
        cancel.style.cursor = 'pointer'
        cancel.style.width = '33%'
        cancel.onclick = function(){that.close()}

        container.appendChild(descL)
        container.appendChild(this.descI)
        container.appendChild(cmdL)
        container.appendChild(this.cmdI)
        container.appendChild(regexL)
        container.appendChild(this.regexI)
        container.appendChild(returnL)
        container.appendChild(this.returnI)
        container.appendChild(apply)
        container.appendChild(test)
        container.appendChild(cancel)
        this.modal.appendChild(container)

        var screen = document.getElementById('screen')
        screen.append(this.modal)
    }

    apply(){
        this.desc = this.descI.value
        this.cmd = this.cmdI.value
        this.regex = this.regexI.value
        this.close()
    }

    open(){
        this.modal.style.display = "block"
    }

    close(){
        this.modal.style.display = "none"
    }

    test(){
        this.cmd = this.cmdI.value
        this.regex = this.regexI.value
        service.get(urls.get_random, {
            params: {
                cmd: this.cmd,
                regex: this.regex
            },
            })
            .then(response => {
                this.returnI.value = response.data.content
            })
    }
}

class DialogAnchorJump
{
    constructor(){
        this.modal = null
        this.jumpCanvas = ''
        this.jumpCanvasI = ''
        this.init()
    }

    init(){
        let that = this

        this.modal = document.createElement('div')
        this.modal.style.display = 'none'
        this.modal.style.position = 'fixed'
        this.modal.style.zIndex = '1'
        this.modal.style.left = 0
        this.modal.style.top = 0
        this.modal.style.width = '100%'
        this.modal.style.height = '100%'
        this.modal.style.overflow = 'auto'
        this.modal.style.backgroundColor = 'rgb(0,0,0)'
        this.modal.style.backgroundColor = 'rgba(0,0,0,0.4)'
        this.modal.style.paddingTop = '60px'

        var container = document.createElement('div')
        container.style.backgroundColor = '#fefefe'
        container.style.margin = '5% auto 15% auto'
        container.style.border = '1px solid #888'
        container.style.width = '40%'

        var jumpCanvasL = document.createElement('label')
        jumpCanvasL.innerHTML = 'BIND CANVAS'
        this.jumpCanvasI = document.createElement('input')
        this.jumpCanvasI.type = 'text'
        this.jumpCanvasI.placeholder = 'Enter the canvas to be bound'
        this.jumpCanvasI.style.width = '100%'
        this.jumpCanvasI.style.padding = '12px 20px'
        this.jumpCanvasI.style.margin = '8px 0'
        this.jumpCanvasI.style.display = 'inline-block'
        this.jumpCanvasI.style.border = '1px solid #ccc'
        this.jumpCanvasI.style.boxSizing= 'border-box'

        var apply = document.createElement('button')
        apply.type = 'submit'
        apply.innerHTML = 'APPLY'
        apply.style.backgroundColor = '#04AA6D'
        apply.style.color = 'white'
        apply.style.padding = '14px 20px'
        apply.style.margin = '8px 0'
        apply.style.border = 'none'
        apply.style.cursor = 'pointer'
        apply.style.width = '50%'
        apply.onclick = function(){that.apply()}

        var cancel = document.createElement('button')
        cancel.innerHTML = 'CANCEL'
        cancel.style.backgroundColor = 'red'
        cancel.style.color = 'white'
        cancel.style.padding = '14px 20px'
        cancel.style.margin = '8px 0'
        cancel.style.border = 'none'
        cancel.style.cursor = 'pointer'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.close()}

        container.appendChild(jumpCanvasL)
        container.appendChild(this.jumpCanvasI)
        container.appendChild(apply)
        container.appendChild(cancel)
        this.modal.appendChild(container)

        var screen = document.getElementById('screen')
        screen.append(this.modal)
    }

    open(){
        this.modal.style.display = "block"
    }

    close(){
        this.modal.style.display = "none"
    }

    apply(){
        this.jumpCanvas = this.jumpCanvasI.value
    }
}
export {KnowledgeNetworkEditView}
// module.exports.KnowledgeNetworkEditView = KnowledgeNetworkEditView