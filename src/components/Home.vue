<template lang="pug">
  div(class="row")
    div(class="page-left" style="background-color:#000000;height:100%;")
      h2 Running Log Analysis
      ul(id="running-log" class="running-log")
        //- li
        //-   a lte_ciasihan_bgr_gh_bxp_2053_telog
        //-     div(class="loader")
    div(class="page-right")
      div(id="topnav" class="topnav")
        a(@click="go") GO
        a(@click="upload") UPLOAD
        input(id="fileInput" type="file" style="display:none" multiple)
      div(class="split left")
        input(id="input1" type="text" name="search" placeholder="Search.." required v-on:keyup="filter")
        div(class="groups")
          ul(id="groups1")
      div(class="split right")
        div(class="groups")
          ul(id="groups2")
      //- form
      //-   div(class="row")
      //-       h2(class="headertekst") TroubleShooting
      //-   div(class="container")
      //-     div(class="row")
      //-       div(class="vl")
      //-         span(class="vl-innertext") VS
      //-       div(class="col")
      //-         input(id="input1" type="text" name="search" placeholder="Search.." required @focus="inputEvent" v-on:keyup="filter")
      //-         div(id="dropdown" class="dropdown")
      //-       div(class="col")
      //-         input(type="text" name="search" placeholder="Search.." disabled)
      //- div(class="bottom-container")
      //-   //- router-link(to="logs" style="color:white" class="btn") GO
      //-   div(class="col")
      //-     a(style="color:white" class="btn" @click="go") GO
      //-   div(class="col")
      //-     a(style="color:white" class="btn" @click="upload") UPLOAD
      //-     input(id="fileInput" type="file" style="display:none" multiple)
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      indices: [],
      queue: [],
      interval: '',
      refresh_interval: 5000,
      errorInfo: '',
      errorShown: false,
    }
  },
  mounted () {
    let that = this
    this.getIndices()
    this.scheduled()
    document.getElementById('fileInput').onchange = function () {
      that.postFile()
    };
  },
  methods: {
    scheduled(){
      let that = this
      this.interval = setInterval(function() {        
        that.getRunningIndices()
        that.getIndices()
      },this.refresh_interval)
    },

    async getRunningIndices () {
      await this.$http.get(this.$urls.running_indices, {
        params: {
        },
        })
        .then(response => {
          this.queue = response.data.content
          this.clearChildDoms('running-log')
          this.createRuningIndices()
        })
    },

    async getIndices () {
      await this.$http.get(this.$urls.indices, {
        params: {
        },
        })
        .then(response => {
          if(this.indices.length != response.data.content.length){
            this.indices = response.data.content
            this.clearChildDoms('groups1')
            this.createDropDown()
          }
        })
    },
    clearChildDoms(id){
      var content = document.getElementById(id)
      while (content.firstChild) {
        content.removeChild(content.lastChild);
      }
    },
    createRuningIndices () {
      Object.keys(this.queue).forEach((index) => {
        var div = document.createElement("div")
        div.setAttribute('class', 'loader')
        var a = document.createElement("a")
        a.innerText = index
        var li = document.createElement("li")
        a.appendChild(div)
        li.appendChild(a)
        document.getElementById('running-log').appendChild(li)
      })
    },
    createDropDown(){
      var indices_sort = this.indices.sort()
      indices_sort.forEach((index) => {
        var elementLeft = document.createElement("li")
        elementLeft.setAttribute('id', index)
        elementLeft.innerText = index
        elementLeft.onclick = function(){
          var elementRight = document.createElement("li")
          elementRight.setAttribute('id', index)
          elementRight.innerText = index

          var span = document.createElement("SPAN");
          var txt = document.createTextNode("\u00D7");
          span.className = "close-list";
          span.appendChild(txt);
          elementRight.appendChild(span);
          document.getElementById("groups2").appendChild(elementRight)

          var close = document.getElementsByClassName("close-list");
          for (var i = 0; i < close.length; i++) {
            close[i].onclick = function() {
              let p = this.parentElement
              this.parentElement.removeChild(this)
              p.parentElement.removeChild(p);
            }
          }
        }
        document.getElementById('groups1').appendChild(elementLeft)
      })
    },
    upload(){
      document.getElementById('fileInput').click()
    },
    async postFile(){
      let formData = new FormData()
      let files = document.getElementById("fileInput").files;
      for (let file of files){
        formData.append("file[]", file);
      }
      let config = {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
      }

      await this.$http.post(this.$urls.send_file, formData, config).then(
        (response)=>{
        
      }, (error) => {
        this.errorInfo = 'Wrong file format or Too large!'
        this.errorShown = true
        setTimeout(() =>{
          this.errorShown = false
        },4000)
      })
    },
    go() {
      var ul, li, i
      var params = []
      ul = document.getElementById("groups2");
      li = ul.getElementsByTagName("li");
      for (i = 0; i < li.length; i++) {
        params.push(li[i].innerText.split(/\n/)[0])
      }
      let routeData = this.$router.resolve({path: '/graphCompare', query:{index: params.join(",")}});
      window.open(routeData.href, '_blank');
    },
    filter(){
      var input, filter, div, a, i, txtValue;
      input = document.getElementById("input1");
      filter = input.value.toUpperCase();
      div = document.getElementById("groups1");
      a = div.getElementsByTagName("li");
      for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          a[i].style.display = "";
        } else {
          a[i].style.display = "none";
        }
      }
    }
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
body {
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

.row {
  display: flex;
}

.page-left {
  flex: 20%;
  border: 1px solid #888;
  padding: 10px 10px;
}

.page-left h2 {
  color: rgb(255, 255, 255);
  text-align: center;
  padding: 15px 0;
}

.page-right {
  flex: 80%;
  padding: 2px;
}

.topnav {
  width: 100%; /* Full-width */
  background-color: #333; /* Dark-grey background */
  overflow: hidden; /* Overflow due to float */
}

.topnav a {
  text-align: center; /* Center-align text */
  float: left;
  width: 50%; /* Equal width (5 icons with 20% width each = 100%) */
  color: white; /* White text color */
  font-size: 36px; /* Increased font size */
  border: 1px solid black;
}

.topnav a:hover {
  background-color: #000; /* Add a hover color */
}

.split {
  height: 100%;
  width: 50%;
  position: relative;
  z-index: 1;
  top: 0;
  overflow-x: hidden;
}

/* Control the left side */
.left {
  float: left;
  left: 0;
  background-color: #ddd;
}

/* Control the right side */
.right {
  right: 0;
  background-color: #ddd;
}

#input1{
  width: 100%;
  padding: 11px;
  border: 1px solid #ddd;
  background-color: #ffffff;
}

.groups{
  position: absolute;
  width: 100%;
  overflow: auto;
}

.groups ul{
  list-style-type: none; /* Remove bullets */
  padding: 0; /* Remove padding */
  margin: 0; /* Remove margins */
}

.groups ul li {
  border: 1px solid #ddd; /* Add a thin border to each list item */
  margin-top: -1px; /* Prevent double borders */
  background-color: #f6f6f6; /* Add a grey background color */
  padding: 12px; /* Add some padding */
}

.groups ul li:hover,
.groups ul li:focus {
  background-color: #666;
  text-decoration: none;
  cursor: pointer;
}

.running-log {
  position: relative;
  list-style-type: none;
  padding: 0;
  margin-left: 10;
}

.running-log li a {
  width: 100%;
  float: left;
  padding: 12px;
  border: 1px solid #888;
  text-decoration: none; /* Remove underline */
  font-size: 15px; /* Increase font size */
  color: white; /* White text color */
  display: block
}

.running-log li a div{
  float: right;
}

.loader {
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Style the close button */
.close-list {
  float: right;
  padding: 0px 20px 10px 20px;
}
.close-list:hover {
  background-color: #f44336;
  color: white;
}

/* vertical line */
.vl {
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  border: 2px solid #ddd;
  height: 100%;
}

/* text inside the vertical line */
.vl-innertext {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 50%;
  padding: 8px 10px;
}

</style>
