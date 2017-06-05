var Wave = Wave || ( function () {

        var $canvas, _ctx,
            _stageWidth, _stageHeight, _stageWidthHalf, _stageHeightHalf,
            _maxWidth, _widthGap,
            _isDown = 0, _mouseX = 0, _mouseY = 0,
            _points = [], _isShowPoint = 0,
            _isColor = 0,

            FRICTION = 0.96,
            TOTAL_WAVE = 3,
            TOTAL_POINTS = 8,
            COLORS = [
                [
                    {h:189, s:100, l:46},
                    {h:196, s:100, l:39},
                    {h:207, s:100, l:31}
                ],
                [
                    {h:0, s:100, l:50},
                    {h:60, s:100, l:50},
                    {h:180, s:100, l:50}
                ]],
            SPRING = [
                .04,
                .06,
                .03
            ],
            _raf;

        function init() {
            $canvas = document.getElementsByTagName('canvas')[0];

            window.addEventListener('resize', onResize, true);
            onResize();

            start();
        }

        function onResize() {
            _stageWidth = window.innerWidth;
            _stageHeight = window.innerHeight;

            _stageWidthHalf = _stageWidth >> 1;
            _stageHeightHalf = _stageHeight >> 1;

            _widthGap = _stageWidth / TOTAL_POINTS >> 1;
            _maxWidth = _stageWidth + (_widthGap * 2);

            $canvas.width = _stageWidth;
            $canvas.height = _stageHeight;
            _ctx = $canvas.getContext('2d');

            build();
        }

        function build() {
            var i, k, point;
            for (i=0; i<TOTAL_WAVE; i++) {
                _points[i] = [];

                for (k=0; k<TOTAL_POINTS; k++) {
                    point = {x: _maxWidth / (TOTAL_POINTS - 1) * k - _widthGap, y:_stageHeightHalf + (Math.random() * 50), vy:0};
                    _points[i][k] = point;
                }
            }
        }

        function start() {
            $canvas.addEventListener('mousedown', onDown, false);
            $canvas.addEventListener('mouseup', onUp, false);
            $canvas.addEventListener('mousemove', onMove, false);

            if (!!('ontouchstart' in window)) {
                $canvas.addEventListener('touchstart', touchStart, false);
                $canvas.addEventListener('touchmove', touchMove, false);
                $canvas.addEventListener('touchend', touchEnd, false);
            }

            initController();

            _raf = window.requestAnimationFrame(animate);
        }

        function initController() {
            var signalOpt = {
                moveControl: new signals.Signal(),
                pointsNumChanged: new signals.Signal()
            };

            var container = new CMControl.Panel();
            container.setClass('sidebar');

            var titleBar = new CMControl.TitleBar(container, signalOpt);
            titleBar.setClass('title-bar');
            container.add(titleBar);
            var item = new CMControl.Panel();
            item.setTextContent('WAVE ANIMATION');
            item.setClass('title');
            titleBar.add(item);
            item = new CMControl.Panel();
            item.setTextContent('VERSION 1.0 - JONGMIN KIM');
            item.setClass('title-s');
            titleBar.add(item);

            // points num
            var pointsCon = new CMControl.Panel();
            container.add(pointsCon);
            var pointsItem = new CMControl.Panel();
            pointsItem.setTextContent('POINTS NUM : 8');
            pointsItem.setClass('label');
            pointsCon.add(pointsItem);
            var slidePoints = new CMControl.Slide(CMControl.getCurrent(8, 3, 16, 0, 1));
            slidePoints.onChange(function (value) {
                signalOpt.pointsNumChanged.dispatch({num: value});
            });
            pointsCon.add(slidePoints);
            signalOpt.pointsNumChanged.add(function(object) {
                var num = CMControl.getCurrent(object.num, 0, 1, 3, 16) | 0;
                TOTAL_POINTS = num;
                pointsItem.setTextContent('POINTS NUM : ' + TOTAL_POINTS);
                onResize();
            });

            // points show/hide
            var checkCon = new CMControl.Panel();
            checkCon.setClass('check');
            container.add(checkCon);
            var checkItem = new CMControl.Panel();
            checkItem.setTextContent('SHOW POINTS');
            checkItem.setClass('label');
            checkCon.add(checkItem);
            var checkBack = new CMControl.Radio(true);
            checkBack.setClass('check-box');
            checkBack.onChange(function() {
                if (!_isShowPoint) return;
                _isShowPoint = 0;
                checkFront.setValue(0);
            });
            checkCon.add(checkBack);
            item = new CMControl.Panel();
            item.setTextContent('HIDE');
            item.setClass('check-text');
            checkCon.add(item);

            container.add(checkCon);
            var checkFront = new CMControl.Radio(false);
            checkFront.setClass('check-box');
            checkFront.onChange(function() {
                if (_isShowPoint) return;
                _isShowPoint = 1;
                checkBack.setValue(0);
            });
            checkCon.add(checkFront);
            item = new CMControl.Panel();
            item.setTextContent('SHOW');
            item.setClass('check-text');
            checkCon.add(item);

            // color
            var colorCon = new CMControl.Panel();
            colorCon.setClass('check');
            container.add(colorCon);
            var colorItem = new CMControl.Panel();
            colorItem.setTextContent('COLOR');
            colorItem.setClass('label');
            colorCon.add(colorItem);
            var colorBack = new CMControl.Radio(true);
            colorBack.setClass('check-box');
            colorBack.onChange(function() {
                if (!_isColor) return;
                _isColor = 0;
                colorFront.setValue(0);
            });
            colorCon.add(colorBack);
            item = new CMControl.Panel();
            item.setTextContent('BLUE');
            item.setClass('check-text');
            colorCon.add(item);

            var colorFront = new CMControl.Radio(false);
            colorFront.setClass('check-box');
            colorFront.onChange(function() {
                if (_isColor) return;
                _isColor = 1;
                colorBack.setValue(0);
            });
            colorCon.add(colorFront);
            item = new CMControl.Panel();
            item.setTextContent('COLORFUL');
            item.setClass('check-text');
            colorCon.add(item);

            // label
            var labelCon = new CMControl.Panel();
            container.add(labelCon);
            item = new CMControl.Panel();
            item.setHTMLContent('<a href="http://blog.cmiscm.com/?p=5452" target="_blank">BLOG.CMISCM.COM</a>');
            item.setClass('link');
            labelCon.add(item);

            signalOpt.moveControl.add(function(object) {
                var tx = object.x;
                slidePoints.setGap(tx);
            });

            document.body.appendChild(container.dom);
        }

        function animate(timestamp) {
            _raf = window.requestAnimationFrame(animate);
            loop();
        }

        function loop() {
            _ctx.clearRect(0, 0, _stageWidth, _stageHeight);

            var i, arr = [0, 5, -5];
            for (i=0; i<TOTAL_WAVE; i++) {
                draw(_points[i], COLORS[_isColor][i], SPRING[i], arr[i]);
            }

            if (_isShowPoint) {
                drawPoints(_points[0], '#ff0000');
            }
        }

        function draw(point, color, spring, gap) {
            _ctx.beginPath();
            _ctx.fillStyle = 'hsla(' + color.h + ', ' + color.s + '%, ' + color.l + '%, 0.4)';

            var prevx = point[0].x, prevy = point[0].y,
                i, dx, dy, dist, my, cx, cy;

            _ctx.moveTo(prevx, prevy);

            for (i=0; i<TOTAL_POINTS; i++) {
                dx = _mouseX - point[i].x;
                dy = (_mouseY - _stageHeight) / 2;
                dist = Math.sqrt(dx * dx + dy * dy) * 0.01;
                my = (_mouseY / dist) + _stageHeightHalf;

                point[i].vy += (my - point[i].y + gap) * spring;
                point[i].vy *= FRICTION;
                point[i].y += point[i].vy;

                cx = (prevx + point[i].x) * .5;
                cy = (prevy + point[i].y) * .5;
                _ctx.bezierCurveTo(prevx, prevy, cx, cy, cx, cy, point[i].x, point[i].y);

                prevx = point[i].x;
                prevy = point[i].y;
            }

            _ctx.lineTo(prevx, prevy);
            _ctx.lineTo(_maxWidth, _stageHeight);
            _ctx.lineTo(point[0].x, _stageHeight);
            _ctx.fill();
            _ctx.closePath();
        }


        function drawPoints(point, color) {
            _ctx.beginPath();
            _ctx.fillStyle = color;
            var i, cx, cy;
            for (i=0; i<TOTAL_POINTS; i++) {
                cx = point[i].x;
                cy = point[i].y;
                _ctx.beginPath();
                _ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
                _ctx.fill();
            }
        }

        function touchStart(e) {
            var touch = e.touches[0];
            downFn(touch.pageX, touch.pageY);
        }
        function touchMove(e) {
            e.preventDefault();
            var touch = e.touches[0];
            moveFn(touch.pageX, touch.pageY);
        }
        function touchEnd(e) {
            upFn();
        }

        function onDown(e) {
            downFn(e.pageX, e.pageY);
        }
        function onMove(e) {
            moveFn(e.pageX, e.pageY);
        }
        function onUp(e) {
            upFn();
        }

        function downFn(mx, my) {
            _isDown = 1;
            _mouseX = mx;
            _mouseY = my;
        }
        function moveFn(mx, my) {
            if (!_isDown) return;
            _mouseX = mx;
            _mouseY = my;
        }
        function upFn() {
            _isDown = 0;
            _mouseX = 0;
            _mouseY = 0;
        }

        return {
            init: init
        }
    } )();


