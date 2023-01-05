<template>
  <div class="scene" ref="screenDom">
    <div class="canvas-container"></div>
  </div>
</template>

<script setup>
import { onMounted,ref, watch } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'


// 导入gui
import gui from '@/three/gui'

import ThreePlus from '@/three/index.js'





// 场景元素声明
let screenDom = ref(null)
const resizeFn = () =>{
  let scale = window.innerWidth / 1920
  screenDom.value.style.transform = `scale(${scale})`
}






onMounted(()=>{
  window.addEventListener('resize',resizeFn)
  let threePlus = new ThreePlus(".canvas-container")

})





</script>

<style>
.scene{
    width:100vw;
    height:100vh;
    position:fixed;
    z-index:100;
    left:0;
    top:0;
}
.canvas-container {
  width: 100%;
  height: 100%;
}
</style>