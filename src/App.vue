<script setup>

    import "bootstrap/dist/css/bootstrap.min.css"
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import "bootstrap"


</script>

<template>
	<div id="app">
        <router-view class="view" ></router-view>
	</div>

</template>

<style>
@import './assets/base.css';

#app {
  margin: 0 ;
  font-weight: normal;
}

#cy {
  height: 90%;
  width: 100%;
}

main {
    margin:2em;
    margin-left: 3%;
    margin-right: 3%;
}

body {
  margin: 0;
  font-family: 'Lato','Helvetica Neue',Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.pointer {
	cursor: pointer;
}
.nav-weskari {
	border-bottom: 0.1mm solid #002957;
	background-color: #002957;
	margin-bottom:0px;
}
.brand {
	margin-left:10px
}
img {
	margin-left:10px
}
.navbar-collapse {
	margin-left: 20px
}

.wrapper {
    display: flex;
    width: 100%;
}

.sidebar {
    background-color: aliceblue;
}

h5 {
	font-size:14px !important;
}

h5 .card-title {
	font-size:14px !important;
    position: static !important;
}
.node {
	border-left: solid #1C86AA 25px;
	font-weight: bold;
	padding-left: 20px
}

.node-plain {
	margin-top:20px;
	font-weight: normal !important;
}

.Team {
	border: none;
	border-left: solid #444791 25px;
	padding-left: 20px
}
.Application {
	border: none;
	border-left: solid purple 25px;
	font-weight: bold;
	padding-left: 20px
}
.Service {
	border: none;
	border-left: solid orange 25px;
	font-weight: bold;
	padding-left: 20px
}
.Person {
	border: none;
	border-left: solid #1C86AA 25px;
	padding-left: 20px
}
.Device {
	border: none;
	border-left: solid purple 25px;
	font-weight: bold;
	padding-left: 20px
}
.Menu {
    border: none;
    border-left: solid #3F7FBF 25px;
    padding-left: 20px
}
.Query {
    border: none;
    border-left: solid #CE49A6 25px;
    padding-left: 20px
}
.Tag {
    border: none;
    border-left: solid #F1C827 25px;
    padding-left: 20px
}
.HelpJYU {
	border: none;
	border-left: solid #002957 25px;
	font-weight: bold;
	padding-left: 20px
}

.list-group {
    margin-bottom:22px;
}


</style>
