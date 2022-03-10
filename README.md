# Introduce

基于vue2.0，实现移动端容器内缩放与位移



# Getting started

1.Install the plugin


```bash
npm i vue-touch-zoom
```

or

```bash
yarn add vue-touch-zoom
```



2.Add the plugin into your app

```js
import Vue from 'vue'
import TouchZoom from 'vue-touch-zoom'

Vue.use(TouchZoom)
```

or

```js
import TouchZoom from 'vue-touch-zoom'

export default{
  components:{
    TouchZoom
  }
}
```

3.Usage

```html
<TouchZoom>
   <div slot="innerDom"></div>
</TouchZoom>
```

TouchZoom is external container,you can use `slot` to add inner content.

4.settings

```html
<TouchZoom :maxScale="2" :minScale="0.5">
   <div slot="innerDom"></div>
</TouchZoom>
```

| Name     | Type   | Solution                | Default  |
| -------- | ------ | ----------------------- | -------- |
| maxScale | Number | maximum grow multiple   | Infinity |
| minScale | Number | minimum shrink multiple | 0        |

# vue-touch-zoom
