<template>
  <div class="touchZoom" ref="touchZoom">
      <div class="transformDom" ref="transformDom">
        <slot name="innerDom"></slot>
      </div>
  </div>
</template>

<script>
export default {
    props: {
        maxScale: {//最大比例放大
            required: false,
            type: Number,
            default: Infinity
        },
        minScale: {//最小比例缩小
            required: false,
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            transformData: {
                x: 0, //x轴偏移量
                y: 0, //y轴偏移量
                scale: 1//缩放比例
            },

            lastTransformData: {
                x: 0,
                y: 0,
                distance: 0//两指之间的距离
            },
            touchType: '', //move表示单指移动，scale表示缩放
            scaleTranslateProportion: [] //根据当前缩放中心带来的位置偏移的比例
        };
    },
    mounted() {
        this.init();
    },
    methods: {
        init() {
            //监听相关的事件
            this.$refs.touchZoom.addEventListener('touchstart', event => this.touchstart(event));
            this.$refs.touchZoom.addEventListener('touchmove', event => this.touchmove(event));
            this.$refs.touchZoom.addEventListener('touchend', event => this.touchend(event));
            //强制设置缩放原点为左上角，根据偏移量计算位置
            this.$refs.transformDom.style.transformOrigin = 'top left';
            //设置默认的位置
            this.setTransform();
        },
        touchstart (event) {
            // event.preventDefault();//注释掉否则会阻止touchStart事件
            if (event.touches.length === 1) {
            // 当前屏幕上只有一个触摸点的时候就是移动
                this.moveStart(event.touches[0].clientX, event.touches[0].clientY);
                this.touchType = 'move';
            } else if (event.touches.length === 2) {
            // 如果两个触摸点是缩放
                this.scaleStart(event.touches);
                this.touchType = 'scale';
            }
        },
        touchmove (event) {
            event.preventDefault();
            if (event.touches.length === 1 && this.touchType === 'move') {
            // 如果屏幕上只有一个触摸点而且类型是移动的时候才是移动
                this.move(event.touches[0].clientX, event.touches[0].clientY);
            } else if (event.touches.length === 2) {
            // 只要有两个触摸点就是缩放,可以从移动转换成缩放
                this.scale(event.touches);
            }
        },
        // 开始移动的方法: 记录首次的数据
        moveStart (x, y) {
            this.lastTransformData.x = x;
            this.lastTransformData.y = y;
        },
        // 移动的方法: 上一次减去当前为偏移量
        move (x, y) {
            this.transformData.x += x - this.lastTransformData.x;
            this.transformData.y += y - this.lastTransformData.y;
            this.lastTransformData.x = x;
            this.lastTransformData.y = y;
            this.setTransform();
        },
        // 开始移动: 记录首次的触摸数据,和中心缩放比例
        scaleStart(touchList) {
            // 算出当前两指之间的距离
            const x = touchList[0].clientX - touchList[1].clientX;
            const y = touchList[0].clientY - touchList[1].clientY;
            this.lastTransformData.distance = Math.sqrt((x * x) + (y * y));
            // 缩放中心为双指点的中心,此时的双指中心只是touchBox上的,得转换成transformDom上的,
            // 因为缩放中心的位置带来translate的变化,是根据当前触摸中心在transformDom上的比例算出来的
            const scaleCenter = [
                ((touchList[0].clientX + (x / 2)) - this.transformData.x) / this.transformData.scale,
                ((touchList[0].clientY + (y / 2)) - this.transformData.y) / this.transformData.scale
            ];
            // 缩放导致偏移的比例
            this.scaleTranslateProportion = [
                scaleCenter[0] / this.$refs.transformDom.offsetWidth,
                scaleCenter[1] / this.$refs.transformDom.offsetHeight
            ];
        },
        // 进行缩放操作
        scale(touchList) {
            // 开始时move后面scale的情况下会没有上一次的scale数据,所以把这次当做start
            if (this.touchType !== 'scale') {
                this.touchType = 'scale';
                this.scaleStart(touchList);
                return;
            }
            // 算出当前两指的距离
            const distance = Math.sqrt(((touchList[0].clientX - touchList[1].clientX) * (touchList[0].clientX - touchList[1].clientX)) +
                ((touchList[0].clientY - touchList[1].clientY) * (touchList[0].clientY - touchList[1].clientY)));
            // 缩放大小为现在的两指距离除去上次的两指距离
            this.doscale(distance / this.lastTransformData.distance, false);
            // 记录这一次两指距离
            this.lastTransformData.distance = distance;
        },
        // 进行指定大小的缩放
        doscale (scale, useCenter = true) {
            // 为0或者为1就不进行缩放
            if (scale === 0 && scale === 1) return;
            // 缩放前的transformDom大小
            const oldSize = [
                this.$refs.transformDom.offsetWidth * this.transformData.scale,
                this.$refs.transformDom.offsetHeight * this.transformData.scale
            ];
            let scaleTranslateProportion = this.scaleTranslateProportion;
            // 如果直接操作,不是双指进行缩放就设置touchZoom中心是缩放中心
            if (useCenter) {
                // touchZoom的中心,
                const scaleCenter = [
                    ((this.$refs.touchZoom.offsetWidth / 2) - this.transformData.x) / this.transformData.scale,
                    ((this.$refs.touchZoom.offsetHeight / 2) - this.transformData.y) / this.transformData.scale
                ];
                // 缩放导致偏移的比例
                scaleTranslateProportion = [
                    scaleCenter[0] / this.$refs.transformDom.offsetWidth,
                    scaleCenter[1] / this.$refs.transformDom.offsetHeight
                ];
            }
            // 设置缩放的偏移,之前纠结在使用两指的偏移位置来计算,实际上缩放后大小的变化不是两指间移动的距离
            // 变化大小其实就是缩放的大小乘原来的大小
            this.transformData.x +=
                oldSize[0] *
                (1 - scale) *
                scaleTranslateProportion[0] || 0;
            this.transformData.y +=
                oldSize[1] *
                (1 - scale) *
                scaleTranslateProportion[1] || 0;
            // 设置缩放
            this.transformData.scale *= scale;
            this.setTransform();
        },
        // 更改移动缩放的效果
        setTransform() {
            // 边界限制
            if (this.transformData.scale<1) {
                if (this.transformData.x<0) {
                    this.transformData.x = 0;
                }
                if (this.transformData.y<0) {
                    this.transformData.y = 0;
                }
                let maxX = this.$refs.touchZoom.offsetWidth - (this.$refs.transformDom.offsetWidth * this.transformData.scale);
                let maxY = this.$refs.touchZoom.offsetHeight - (this.$refs.transformDom.offsetHeight * this.transformData.scale);

                if (this.transformData.x> maxX) {
                    this.transformData.x = maxX;
                }
                if (this.transformData.y> maxY) {
                    this.transformData.y = maxY;
                }
            } else {
                if (this.transformData.x>0) {
                    this.transformData.x = 0;
                }
                if (this.transformData.y>0) {
                    this.transformData.y = 0;
                }
                let minX = this.$refs.touchZoom.offsetWidth - (this.$refs.transformDom.offsetWidth * this.transformData.scale);
                let minY = this.$refs.touchZoom.offsetHeight - (this.$refs.transformDom.offsetHeight * this.transformData.scale);
                if (this.transformData.x< minX) {
                    this.transformData.x = minX;
                }
                if (this.transformData.y< minY) {
                    this.transformData.y = minY;
                }
            }
            this.$refs.transformDom.style.height = '100%';
            this.$refs.transformDom.style.transform = `translate(${this.transformData.x || 0}px, ${this.transformData.y || 0}px) scale(${this.transformData.scale || 0}, ${this.transformData.scale || 0})`;
        },
        // 放大操作
        enlargeScale(size = 1.2) {
            // 如果没有超过限制就正常缩放,超过了就缩放到限制大小
            if (this.transformData.scale * size <= this.maxScale) {
                this.doscale(size);
            } else {
                this.doscale(this.maxScale / this.transformData.scale);
            }
        },
        // 缩小操作
        narrowScale(size = 0.8) {
            if (this.transformData.scale * size >= this.minScale) {
                this.doscale(size);
            } else {
                this.doscale(this.minScale / this.transformData.scale);
            }
        },
        touchend () {
            this.lastTransformData = {
                x: 0,
                y: 0,
                distance: 0
            };
            this.touchType = '';
            if (this.transformData.scale > this.maxScale) {
                this.doscale(this.maxScale / this.transformData.scale, false);
            }
            if (this.transformData.scale < this.minScale) {
                this.doscale(this.minScale / this.transformData.scale, false);
            }
        },
        reset() {
            return new Promise((resolve) => {
                this.transformData = {
                    x: 0, //x轴偏移量
                    y: 0, //y轴偏移量
                    scale: 1//缩放比例
                };
                this.lastTransformData = {
                    x: 0,
                    y: 0,
                    distance: 0//两指之间的距离
                };
                this.$refs.transformDom.style.transform = 'translate(0px, 0px) scale(1)';
                resolve();
            });
        },
        getTransformData () {
            return this.transformData;
        },
        distory() {
            this.$refs.touchZoom.removeEventListener('touchstart');
            this.$refs.touchZoom.removeEventListener('touchmove');
            this.$refs.touchZoom.removeEventListener('touchend');
        }

    }
};
</script>

<style lang="less" scoped>
.touchZoom {
    overflow: hidden;
    .transformDom {
        width: 100%;
        height: 100%;
    }
}
</style>
