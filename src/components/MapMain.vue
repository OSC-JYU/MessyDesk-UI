
<script setup>
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    document.title = "KuKaKo-OSC Map"
</script>


<template>
    <div class="vh-100 container-fluid m-0 p-0">
        <div class="row  h-100  w-100 m-0 p-0">
            <div class="col-12 m-0 p-0">
                <div class="h-100 d-flex flex-column w-100 m-0 p-0">
                    <div class="row justify-content-center m-0 p-0">
                        <JYUHeader/>
                    </div>
                    <div class="row m-0 p-0  flex-grow-1">
                        <GraphDisplay mode="maps"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>



<style scoped>

header a {
  color: white;
  text-decoration: none;
  margin-left: 1em;
  font-family: 'Aleo','Lato','Helvetica Neue',Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 20px;
}

header {
  width: 100%;
  background-color: #002957;
  display: flex;
  align-items: center;
}

header a {
  font-family: 'Aleo','Lato','Helvetica Neue',Arial,sans-serif;
  border: 0;
  background-color: transparent;
  color: white;
  font-size: 20px;
}

img {
  height: 50px;
  width: auto;
  margin: 1em 1em 1em 2em;
}

.buttons {
  margin-left: auto;
  padding-right: 2em;
}
</style>
