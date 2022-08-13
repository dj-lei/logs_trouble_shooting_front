<template lang="pug">
  div(class="row")
    div(class="left" style="background-color:#000000;height:100%;")
      h2 Running Log Analysis
      ul(id="running-log" class="running-log")
        //- li
        //-   a lte_ciasihan_bgr_gh_bxp_2053_telog
        //-     div(class="loader")
    div(class="right" style="background-color:#000000;height:100%;")
      form
        div(class="row")
            h2(class="headertekst") TroubleShooting
        div(class="container")
          div(class="row")
            div(class="vl")
              span(class="vl-innertext") VS
            div(class="col")
              input(id="input1" type="text" name="search" placeholder="Search.." required @focus="inputEvent" v-on:keyup="filter")
              div(id="dropdown" class="dropdown")
            div(class="col")
              input(type="text" name="search" placeholder="Search.." disabled)
      div(class="bottom-container")
        //- router-link(to="logs" style="color:white" class="btn") GO
        div(class="col")
          a(style="color:white" class="btn" @click="go") GO
        div(class="col")
          a(style="color:white" class="btn" @click="upload") UPLOAD
          input(id="fileInput" type="file" style="display:none" multiple)
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
            this.clearChildDoms('dropdown')
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
      this.indices.forEach((index) => {
        var element = document.createElement("a")
        element.setAttribute('id', index)
        element.innerText = index
        element.onclick = function(){
          document.getElementById('input1').value = index
          document.getElementById("dropdown").classList.toggle("show");
        }
        document.getElementById('dropdown').appendChild(element)
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
      clearInterval(this.interval)
      this.$router.push({path: '/logs', query:{index: document.getElementById('input1').value}});
      // window.open(routeData.href, '_blank');
    },
    inputEvent(){
      document.getElementById("dropdown").classList.toggle("show");
    },
    filter(){
      var input, filter, div, a, i, txtValue;
      input = document.getElementById("input1");
      filter = input.value.toUpperCase();
      div = document.getElementById("dropdown");
      a = div.getElementsByTagName("a");
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
<style>
body {
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

.row {
  display: flex;
}

.left {
  flex: 20%;
  border: 1px solid #888;
  padding: 15px 10px;
}

.left h2 {
  color: rgb(255, 255, 255);
  text-align: center;
  padding: 15px 0;
}

.right {
  flex: 80%;
  padding: 15px;
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

/* style the container */
.container {
  position: relative;
  border-radius: 5px;
  background-color: #f2f2f2;
  margin-top: 50px;
  padding: 20px 0 30px 0;
} 

/* bottom container */
.bottom-container {
  text-align: center;
  background-color: #666;
  border-radius: 200px 200px 200px 200px;
  margin-top: 10px;
  margin-left: 500px;
  margin-right: 500px;
  /* padding: 20px 0 30px 0; */
}

.col {
  float: left;
  width: 50%;
  margin: auto;
  padding: 0 50px;
  margin-top: 60px;
}

.dropdown {
  position: fixed;
  z-index: 1;
  display: none;
  background-color: #f6f6f6;
  min-width: 230px;
  overflow: auto;
  top:30%;
  border: 1px solid #ddd;
}

.dropdown a {
  color: black;
  background-color: rgb(139, 139, 139);
  padding: 12px 16px;
  text-decoration: none;
  border: 1px solid #ddd;
  display: block;
}
.dropdown a:hover {background-color: #ddd;}
.show {display: block;}

/* style inputs and link buttons */
input {
  margin: 0;
  border: none;
  border-radius: 0;
  width: 100%;
  padding: 10px;
  float: left;
  font-size: 16px;
  background-color: white;
}

.btn {
  background-color: rgb(139, 139, 139);
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  margin: 5px 0;
  opacity: 0.85;
  display: inline-block;
  font-size: 17px;
  line-height: 20px;
  text-decoration: none; /* remove underline from anchors */
}

input:hover,
.btn:hover {
  opacity: 1;
}

/* Two-column layout */
h2.headertekst {
  width: 100%;
  margin-top: 100px;
  text-align: center;
  color: rgb(255, 255, 255);
}

/* vertical line */
.vl {
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  border: 2px solid #ddd;
  height: 120px;
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
