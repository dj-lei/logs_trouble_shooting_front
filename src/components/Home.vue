<template lang="pug">
  div(class="home-row full-height")
    div(class="page-left" style="background-color:#000000;height:100%;")
      a(@click="openUploadModal") UPLOAD
      h2 Running Log Analysis
      ul(id="running-log" class="running-log")
        //- li
        //-   a lte_ciasihan_bgr_gh_bxp_2053_telog
        //-     div(class="loader")
    div(class="page-right")
      div(id="topnav" class="home-topnav")
        a(class="active" @click="goLogicView") GO LOGIC
        a(class="deactive") GO COMPARE
        input(id="fileInput" type="file" style="display:none")
      div(class="split left")
        input(id="input1" type="text" name="search" placeholder="Search.." required v-on:keyup="filter")
        div(class="groups")
          ul(id="groups1")
      div(class="split right")
        div(class="groups")
          ul(id="groups2")
        div(id="highlight-modal" class="modal")
    div(class="loading hidden")
      div(class='uil-ring-css' style='transform:scale(0.79);')
        div
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
    this.$common.setBrowserTitle("Home")
    this.getIndices()
    this.scheduled()
    document.getElementById('fileInput').onchange = function () {
      var file = document.getElementById("fileInput").files
      if (file.length > 0) {
        that.submit()
      }
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
          this.$common.removeAllChildDom('running-log')
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
            this.$common.removeAllChildDom('groups1')
            this.createDropDown()
          }
        })
    },
    createRuningIndices () {
      this.queue.forEach((index) => {
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
      let that = this
      var indices_sort = this.indices.sort()
      indices_sort.forEach((index) => {
        var elementLeft = document.createElement("li")
        elementLeft.setAttribute('id', index)
        elementLeft.innerText = index
        elementLeft.onclick = function(){
          that.$common.removeAllChildDom('groups2')
          if (!document.getElementById("groups2").hasChildNodes()) {
            var elementRight = document.createElement("li")
            elementRight.setAttribute('id', index)
            elementRight.innerText = index

            // var span = document.createElement("a");
            // span.innerText = "X"
            // var txt = document.createTextNode("\u00D7");
            // span.className = "close-list";
            // span.appendChild(txt);
            // elementRight.appendChild(span);
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
        }
        document.getElementById('groups1').appendChild(elementLeft)
      })
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
    },
    openUploadModal(){
      document.getElementById('fileInput').click()
    },
    closeUploadModal(){
      var modal = document.getElementById("upload-modal")
      modal.style.display = "none"
      document.getElementById('fileInput').value = null
      document.getElementById('submit').disabled = true
      
    },
    select(){
      document.getElementById('fileInput').click()
    },
    async submit(){
      var file = document.getElementById("fileInput").files[0];
      this.$common.startLoading()
      let formData = new FormData()
      formData.append("file", file);
      let config = {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
      }

      await this.$http.post(this.$urls.send_file, formData, config).then(
        (response)=>{
        this.$common.stopLoading()
      }, (error) => {
        alert("Log File Format ERROR or Not Support Currently!");
        this.$common.stopLoading()
      })
    },
    async goCompareView(){
      var ul, li, i
      var params = []
      ul = document.getElementById("groups2");
      li = ul.getElementsByTagName("li");
      for (i = 0; i < li.length; i++) {
        params.push(li[i].innerText.split(/\n/)[0])
      }
      await this.$http.get(this.$urls.logs_trouble_shooting, {
          params: {
            index: params[0]
          },
          })
        .then(response => {
          console.log(response.data.content)
      })
    },
    async goLogicView(){
      var ul, li, i
      var params = []
      ul = document.getElementById("groups2");
      li = ul.getElementsByTagName("li");
      for (i = 0; i < li.length; i++) {
        params.push(li[i].innerText.split(/\n/)[0])
      }

      let routeData = this.$router.resolve({path: '/logicview', query:{index: params[0]}})
      window.open(routeData.href, '_blank');
    }

      // await this.$http.get(this.$urls.logs_trouble_shooting, {
      //     params: {
      //       index: params[0]
      //     },
      //     responseType: 'blob',
      //     })
      //   .then(response => {
      //   var blob = response.data
      //   var arrayBuffer;
      //   var fileReader = new FileReader();
      //   fileReader.readAsArrayBuffer(blob);

      //   fileReader.onload = function() {
      //     // console.log(e)
      //     arrayBuffer = fileReader.result;
      //     try {
      //       let result = pako.inflate(arrayBuffer, {"to": "string"});
      //       let obj = JSON.parse(result);
      //       console.log(obj);
      //     } catch (err) {
      //       console.log("Error " + err);
      //     }
      //   };
        
      // })
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
* {
  box-sizing: border-box;
}

html,body {
  font-family: Arial;
  height: 100%;
  background: #555;
  margin: 0px 0px 0px 0px;
}

.full-height {
  height: 100%;
}
.home-row {
  display: flex;
  height: 100%;
}

.page-left {
  flex: 20%;
  height: 100%;
  color: rgb(255, 255, 255);
  border: 1px solid #888;
  /* padding: 10px 10px; */
}

.page-left h2 {
  color: rgb(255, 255, 255);
  text-align: center;
  padding: 0px 0;
}

.page-left a {
  display: block;
  color: rgb(255, 255, 255);
  width: 100%;
  text-align: center;
  font-size: 36px;
  padding: 0px 0;
  border: 1px solid rgb(0, 0, 0);
  background-color: #FFA500;
}

.page-left a:hover {
  background-color: #000; /* Add a hover color */
}

.page-right {
  flex: 80%;
  padding: 0px;
}

.home-topnav {
  width: 100%; /* Full-width */
  background-color: #FFA500; /* Dark-grey background */
  overflow: hidden; /* Overflow due to float */
}

.home-topnav .active {
  text-align: center; /* Center-align text */
  float: left;
  width: 50%; /* Equal width (5 icons with 20% width each = 100%) */
  color: white; /* White text color */
  font-size: 36px; /* Increased font size */
  border: 1px solid black;
}

.home-topnav .active:hover {
  background-color: #000; /* Add a hover color */
}

.home-topnav .deactive {
  text-align: center; /* Center-align text */
  float: left;
  width: 50%; /* Equal width (5 icons with 20% width each = 100%) */
  color: rgb(211, 202, 202); /* White text color */
  font-size: 36px; /* Increased font size */
  border: 1px solid black;
  background-color: #f3f3f3;
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
  background-color: #f6f6f6; /* Add a grey background color */
  padding: 12px !important;
  font-size: 12px !important;
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

.running-log li{
  background-color: #000 !important;
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
  border: 8px solid #f3f3f3; /* Light grey */
  border-top: 8px solid #3498db; /* Blue */
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
  padding: 12px;
  font-size: 12px;
  margin-bottom: 15px;
}
.close-list:hover {
  background-color: #f44336;
  color: white;
}
</style>
