<template>
<div class="btn-container" >
<button @click="skipVideoCredit"  >
    <img v-if="hasPosterImage" :src="posterImage" >
   <span>
     {{ title }}
   </span>
</button>
</div>
</template>
<script setup lang="ts" > 
const emits = defineEmits(['skipVideoCredit'])

const skipVideoCredit = ()=>{
    emits('skipVideoCredit')
}
const props = defineProps({

    title:{
        type:String
    },
    posterImage:{
        type:String
    },
    hasPosterImage:{
        type:Boolean
    },
})
</script>
<style scoped >
.btn-container {
    background-color: rgba(235, 235, 235, 0.5);
    padding: 8px;
    display: flex;
    border-top-left-radius: 8px;
    border-end-start-radius: 8px;
    align-content: center;
    align-items: center;
    justify-content: start  ;
    position: absolute;
    bottom: 100px;
    right: 0px;
    z-index: 5000;
    height: 76px;
    width: 200px;    
    transform: translateY(50px);
    animation: slide-in 0.5s ease-out alternate;
    @media(min-width:300px) and (max-width:580px )  {
            height: 40px;
            width: 160px;    
            padding: 4px;
            bottom: 110px;
    }
    @media(min-width:580px) and (max-width:960px )  {
            height: 40px;
            width: 160px;    
            padding: 4px;
            bottom: 80px;
    }
    @media (min-width:960px) and (max-width:1366px ) {
            height: 48px;
            width: 172px;    
            padding: 6px;
            bottom: 100px;
    }
    @media (min-width:1366px) {
            height: 50px;
            width: 160px;    
            padding: 4px;
            bottom: 120px;
           
    }

    }
    button{
        background-color: #029CF5;
        color: #fcfcfc;
        
        font-weight: 500;
        border-radius: 8px;
        width: 150px;
        height: 60px;

    img {
      margin-left: 5px;
    }


        @media(min-width:300px) and (max-width:580px )  {
            height: 32px;
            width: 140px;    
            padding: 4px;
            font-size: 12px;
        }
        @media (min-width:580px) and (max-width:960px ) {
            height: 32px;
            width: 140px;    
            padding: 4px;
            font-size: 12px;
      
        }
        @media (min-width:960px) and (max-width:1366px) {
            height: 40px;
            width: 130px;    
            font-size: 14px;
    }
        @media (min-width:1366px) {
            height: 42px;
            width: 142px;    
           font-size: 14px;
      
    }
    }
@keyframes slide-in {
  0% {
    right: -220px; 
  }

  100% {
    right: 0px; 
  }
}


</style>