import * as d3 from "d3"

function KnowledgeNetworkEditView()
{
    this.containerCanvas = document.createElement('div')
    this.containerCanvas.setAttribute('id', 'container-canvas')
    this.bottomNav = document.createElement('div')
    this.bottomNav.setAttribute('id', 'bottom-nav')
    this.upload = document.createElement('input')
    this.upload.setAttribute('id', 'svgUpload')
    this.upload.setAttribute('type', 'file')
    this.upload.style.display = 'none'

    var screen = document.getElementById('screen')
    screen.append(this.containerCanvas)
    screen.append(this.bottomNav)
    screen.append(this.upload)

    this.addAnchorButton()
    this.addUploadButton()

    this.test1 = new Canvas('TEST1')
    this.test2 = new Canvas('TEST2')
    this.test3 = new Canvas('TEST3')
};

KnowledgeNetworkEditView.prototype.init = function()
{
    setTimeout(function(){ 
        document.getElementById("TEST1-nav").click(); 
    }, 50)
}

KnowledgeNetworkEditView.prototype.addUploadButton = function()
{
    let that = this
    var upload = document.createElement('button')
    upload.style.backgroundColor = '#555'
    upload.style.color = 'white'
    upload.style.float = 'left'
    upload.style.border = 'none'
    upload.style.outline = 'none'
    upload.style.cursor = 'pointer'
    upload.style.padding = '14px 16px'
    upload.style.fontSize = '17px'
    upload.style.width = '25%'
    upload.innerHTML = 'UPLOAD'
    upload.addEventListener('click', function()
    {
        document.getElementById('svgUpload').click()
    })
    document.getElementById('svgUpload').onchange = function (event) {
        var file = document.getElementById("svgUpload").files[0]
        that.test1.insertSymbol(file)
        that.test2.insertSymbol(file)
    }
    document.getElementById('bottom-nav').appendChild(upload)
}

KnowledgeNetworkEditView.prototype.addAnchorButton = function()
{
    let that = this
    var anchor = document.createElement('button')
    anchor.style.backgroundColor = '#555'
    anchor.style.color = 'white'
    anchor.style.float = 'left'
    anchor.style.border = 'none'
    anchor.style.outline = 'none'
    anchor.style.cursor = 'pointer'
    anchor.style.padding = '14px 16px'
    anchor.style.fontSize = '17px'
    anchor.style.width = '25%'
    anchor.innerHTML = 'ANCHOR'
    anchor.addEventListener('click', function()
    {
        that.test1.insertAnchor()
        that.test2.insertAnchor()
    })
    document.getElementById('bottom-nav').appendChild(anchor)
}

function Canvas(name)
{
    this.name = name
    this.svg = ''
    this.transform = ''
    this.containerSymbol = []
    this.initCanvas()
};

Canvas.prototype.initCanvas = function()
{
    var tabcontent = document.createElement('div')
    tabcontent.setAttribute('id', this.name+'-content')
    tabcontent.style.width = '100%'
    tabcontent.className = "tabcontent"

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('id', this.name)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', document.body.offsetHeight - 50)
    tabcontent.appendChild(svg)

    document.getElementById('container-canvas').appendChild(tabcontent)
    this.resetCoordinates()
    this.registerNav()

    this.svg = d3.select(`#${this.name}`).append("g")
        .attr("id", "canvas")
        .style("font", "8px sans-serif")
}

Canvas.prototype.resetCoordinates = function()
{
    let that = this
    var zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", zoomed)
    d3.select(`#${this.name}`).call(zoom).on("dblclick.zoom", null)

    function zoomed(event){
        const {transform} = event
        that.transform = transform
        that.svg.attr("transform", transform)
        that.refreshSymbol()
    }
}

Canvas.prototype.refreshSymbol = function()
{
    this.containerSymbol.forEach((symbol) => {
        symbol.isShowChildCanvas(this.transform)
    })
}

Canvas.prototype.registerNav = function()
{
    let that = this
    var tablink = document.createElement('button')
    tablink.setAttribute('id', this.name+'-'+'nav')
    tablink.style.backgroundColor = '#555'
    tablink.style.color = 'white'
    tablink.style.float = 'left'
    tablink.style.border = 'none'
    tablink.style.outline = 'none'
    tablink.style.cursor = 'pointer'
    tablink.style.padding = '14px 16px'
    tablink.style.fontSize = '17px'
    tablink.style.width = '25%'
    tablink.className = "tablink"
    tablink.innerHTML = this.name
    tablink.addEventListener('click', function()
    {
        that.openPage(that.name+'-content', tablink)
    })
    document.getElementById('bottom-nav').appendChild(tablink)
}

Canvas.prototype.insertSymbol = function(file)
{
    let that = this

    var fileName = file.name.split('.')[0]
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = ()=>{
        d3.xml(reader.result)
        .then(data => {
            var tmp = data.documentElement
            that.svg.append("g")
                .attr("id", fileName)
                .attr("class", 'symbol')
                .node().append(tmp)

            that.containerSymbol.push(new Symbol(that.svg.select(`#${fileName}`), that.svg.select(`#${fileName}`).node().getBBox()))
        })
    }
}

Canvas.prototype.insertAnchor = function()
{
    var anchor = this.svg.append("g")
            .attr("class", 'anchor')
    anchor.append("circle")
        .style("stroke", "gray")
        .style("fill", "black")
        .attr("r", 40)
        .attr("cx", 50)
        .attr("cy", 20)
    this.containerSymbol.push(new Anchor(anchor))
}

Canvas.prototype.openPage = function(name, element)
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
}

function Symbol(svg, box)
{
    this.svg = svg
    this.symbolWidth = box.width
    this.symbolHeight = box.height
    this.screenWidth = document.body.offsetWidth
    this.screenHeight = document.body.offsetHeight
    this.childCanvas = 'TEST2'
    this.childContainerSymbol = []
}

Symbol.prototype.isShowChildCanvas = function(transform)
{
    let that = this

    var k = transform.k
    if ((k * this.symbolWidth > this.screenWidth * 0.8) | (k * this.symbolHeight > this.screenHeight * 0.8))
    {
        this.svg.style('visibility', 'hidden')
        d3.select(`#${this.childCanvas}`).select("#canvas").selectAll(".symbol").each(function(d, i) {
            d3.select(`#TEST1`).select("#canvas").node().append(d3.select(this).node())
            that.childContainerSymbol.push(new Symbol(d3.select(this), d3.select(this).node().getBBox()))
        })
        // console.log(d3.select(`#TEST1`).node())
    }else{
        for(var i=0; i < this.childContainerSymbol.length; i++)
        {
            var symbol = this.childContainerSymbol.pop()
            symbol.svg.remove()
        }
        this.svg.style('visibility', 'visible')
    }
    // console.log(d3.select(`#TEST1`).select("#canvas").node())
}

function Anchor(svg)
{
    this.svg = svg
}

Anchor.prototype.init = function()
{

}
export {KnowledgeNetworkEditView}
// module.exports.KnowledgeNetworkEditView = KnowledgeNetworkEditView