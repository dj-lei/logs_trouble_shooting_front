<template lang="pug">
  div(class="home-row full-height")
    div(class="page-left" style="background-color:#000000;height:100%;")
      h2 Running Log Analysis
      ul(id="running-log" class="running-log")
        //- li
        //-   a lte_ciasihan_bgr_gh_bxp_2053_telog
        //-     div(class="loader")
    div(class="page-right")
      div(id="topnav" class="home-topnav")
        a(@click="openUploadModal") UPLOAD
        a(@click="go") GO
        input(id="fileInput" type="file" style="display:none")
      div(class="split left")
        input(id="input1" type="text" name="search" placeholder="Search.." required v-on:keyup="filter")
        div(class="groups")
          ul(id="groups1")
      div(class="split right")
        div(class="groups")
          ul(id="groups2")
        div(id="highlight-modal" class="modal")
    //- div(id="upload-modal" class="modal")
    //-   div(class="modal-content")
    //-       div(class="modal-header")
    //-         h2 Log Prefix & Upload
    //-         form
    //-           label Platform: 
    //-           input(type="text" id="platform" placeholder="visby oslo or ...")
    //-           label Product: 
    //-           input(type="text" id="product" placeholder="6626 4485 or ...")
    //-           label Category: 
    //-           input(type="text" id="category" placeholder="lab or customer")
    //-           label UniqueId: 
    //-           input(type="text" id="uniqueid" placeholder="Unique identification")
    //-       div(class="modal-footer")
    //-         button(id="submit" class="button" @click="submit" disabled) Submit
    //-         button(id="select" class="button" @click="select") Select
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
      // document.getElementById('submit').disabled = false
      that.submit()
    };

    // window.onclick = function(event) {
    //   if (event.target == document.getElementById("upload-modal")) {
    //     that.closeUploadModal();
    //   }
    // }
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
      // var modal = document.getElementById("upload-modal")
      // modal.style.display = "block"
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
      // if((document.getElementById("platform").value == '') | (document.getElementById("product").value === '') | (document.getElementById("category").value == '') | (document.getElementById("uniqueid").value == '')){
      //   alert("Platform or Product or Category or Uniqueid must write something!");
      //   return
      // }
      var file = document.getElementById("fileInput").files[0];
      // var dup = []
      // for (let file of files){
      //   var name = document.getElementById("platform").value.toLowerCase() + "_" + document.getElementById("product").value.toLowerCase() + "_" + document.getElementById("category").value.toLowerCase() + "_" + document.getElementById("uniqueid").value.toLowerCase() + "_" + file.name.toLowerCase()
      //   if(this.indices.includes(name)){
      //     dup.push(name)
      //   }
      // }
      // if(dup.length > 0){
      //   alert(`File combine name is not unique: ${dup.join(",")}`);
      //   return
      // }
      
      this.$common.startLoading()
      let formData = new FormData()
      // for (let file of files){
      //   formData.append("file[]", file);
      // }
      formData.append("file", file);
      console.log(formData)
      // formData.append("platform", document.getElementById("platform").value);
      // formData.append("product", document.getElementById("product").value);
      // formData.append("category", document.getElementById("category").value);
      // formData.append("uniqueid", document.getElementById("uniqueid").value);
      let config = {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
      }

      await this.$http.post(this.$urls.send_file, formData, config).then(
        (response)=>{
        this.$common.stopLoading()
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
      let routeData = this.$router.resolve({path: '/compareview', query:{index: params.join(",")}});
      window.open(routeData.href, '_blank');
    },
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

.page-right {
  flex: 80%;
  padding: 0px;
}

.home-topnav {
  width: 100%; /* Full-width */
  background-color: #333; /* Dark-grey background */
  overflow: hidden; /* Overflow due to float */
}

.home-topnav a {
  text-align: center; /* Center-align text */
  float: left;
  width: 50%; /* Equal width (5 icons with 20% width each = 100%) */
  color: white; /* White text color */
  font-size: 36px; /* Increased font size */
  border: 1px solid black;
}

.home-topnav a:hover {
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
  padding: 12px !important; /* Add some padding */
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
  padding: 0px 20px 10px 20px;
}
.close-list:hover {
  background-color: #f44336;
  color: white;
}

/***************************************** log prefix & upload modal css */
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
  width: 55%;
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
.modal-header label {
  float: left;
  font-size: 15px;
}
.modal-header input {
  float: left;
  border: none;
  border-radius: 0;
  width: 15%;
  padding: 5px;
  font-size: 10px;
  background-color: white;
}

.modal-footer {
  padding: 0px 0px 0px 0px;
  background-color: #333;
  color: white;
}

/* Style the "Add" button */
.modal-footer .button {
  padding: 5px;
  width: 50%;
  background: #d9d9d9;
  color: #ffffff;
  text-align: center;
  font-size: 20px;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 0;
}
.modal-footer .button:hover {
  background-color: #bbb;
}

/* Modal Body */
/* .modal-body {padding: 2px 16px;} */

/* Add Animation */
@keyframes animatetop {
  from {top: -300px; opacity: 0}
  to {top: 0; opacity: 1}
}

/***************************************** full screen loading css */
.hidden {
  display: none !important;
}

div.loading{
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(16, 16, 16, 0.5);
}

@keyframes uil-ring-anim {
  0% {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

.uil-ring-css {
  margin: auto;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 200px;
  height: 200px;
}
.uil-ring-css > div {
  position: absolute;
  display: block;
  width: 160px;
  height: 160px;
  top: 20px;
  left: 20px;
  border-radius: 80px;
  box-shadow: 0 6px 0 0 #ffffff;
  -ms-animation: uil-ring-anim 1s linear infinite;
  -moz-animation: uil-ring-anim 1s linear infinite;
  -webkit-animation: uil-ring-anim 1s linear infinite;
  -o-animation: uil-ring-anim 1s linear infinite;
  animation: uil-ring-anim 1s linear infinite;
}
</style>
