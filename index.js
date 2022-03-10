import TouchZoom from './src/touchZoom.vue';

TouchZoom.install = Vue => Vue.Component(TouchZoom.name,TouchZoom);

if(typeof window!== 'undefined'&&window.Vue){
    install(window.Vue);
}

export default TouchZoom;