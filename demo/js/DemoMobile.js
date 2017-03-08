(function() {

    // Matter aliases
    var Engine = Matter.Engine,
        Gui = Matter.Gui,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Common = Matter.Common,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Events = Matter.Events;

    var Demo = {};

    var _engine,
        _sceneName = 'mixed',
        _sceneWidth,
        _sceneHeight;

    var _stack;
    var _bodiesToBeMovedNextFrame = [];
    var _sound;

    Demo.init = function() {
        var canvasContainer = document.getElementById('canvas-container'),
            demoStart = document.getElementById('demo-start');

        _sound = new Howl({
            src: ['ogg/rattle.ogg', 'ogg/rattle.mp3'],
            sprite: {
                clink1: [0, 33],
                clink2: [45, 125],
                clink3: [125, 154],
                clink4: [162, 210],
                bigClink: [212, 308]
            }
        });

        demoStart.addEventListener('click', Demo.start);


        if (window.DeviceMotionEvent == undefined) {
            //No accelerometer is present. Use buttons.
            alert("no accelerometer");
        }
        else {
            //alert("accelerometer found");
            window.addEventListener("devicemotion", Demo.applyForces, true);
        }

        window.addEventListener('deviceorientation', Demo.updateGravity, true);
        window.addEventListener('touchstart', Demo.fullscreen);
        window.addEventListener('orientationchange', function() {
            Demo.updateGravity();
            setTimeout(function() {
                Demo.updateScene();
            }, 800);
            Demo.fullscreen();
        }, false);
    };

    window.addEventListener('load', Demo.init);

    Demo.start = function() {

        var canvasContainer = document.getElementById('canvas-container'),
            demoStart = document.getElementById('demo-start');

        demoStart.style.display = 'none';

        _engine = Engine.create(canvasContainer, {
            render: {
                options: {
                    wireframes: true,
                    showAngleIndicator: true,
                    showDebug: true
                }
            }
        });



        Demo.fullscreen();

        setTimeout(function() {
            Engine.run(_engine);
            Events.on(_engine, 'beforeUpdate', Demo.pushCollisions);
            Events.on(_engine, 'collisionStart', Demo.onCollisionStart);
            Demo.updateScene();
        }, 800);

    };

    Demo.mixed = function() {
        var _world = _engine.world;

        Demo.reset();

        World.add(_world, MouseConstraint.create(_engine));

        _stack = Composites.stack(0, 0, 2, 2, 0, 0, function(x, y, column, row) {
            /*switch (Math.round(Common.random(0, 1))) {

                case 0:
                    if (Math.random() < 0.8) {
                        return Bodies.rectangle(x, y, Common.random(20, 40), Common.random(20, 40), { friction: 0.01, restitution: 0.4 });
                    } else {
                        return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(20, 30), { friction: 0.01, restitution: 0.4 });
                    }
                    break;
                case 1:
                    return Bodies.polygon(x, y, Math.round(Common.random(4, 6)), Common.random(20, 40), { friction: 0.01, restitution: 0.4 });

            }*/

            /*
             FRICTIONSTATIC
             A Number that defines the static friction of the body (in the Coulomb friction model). A value of 0 means
             the body will never 'stick' when it is nearly stationary and only dynamic friction is used. The higher the
             value (e.g. 10), the more force it will take to initially get the body moving when nearly stationary. This
             value is multiplied with the friction property to make it easier to change friction and maintain an
             sappropriate amount of static friction.
             */

            /*
             FRICTION
             A Number that defines the friction of the body. The value is always positive and is in the range (0, 1). A
             value of 0 means that the body may slide indefinitely. A value of 1 means the body may come to a stop
             almost instantly after a force is applied.
             The effects of the value may be non-linear. High values may be unstable depending on the body. The engine
             uses a Coulomb friction model including static and kinetic friction. Note that collision response is based
             on pairs of bodies, and that friction values are combined with the following formula:
            /*
             RESTITUTION
             A Number that defines the restitution (elasticity) of the body. The value is always positive and is in the
             range (0, 1). A value of 0 means collisions may be perfectly inelastic and no bouncing may occur. A value of
             0.8 means the body may bounce back with approximately 80% of its kinetic energy. Note that collision
             response is based on pairs of bodies, and that restitution values are combined with the following formula:
             */
            /*
             FRICTIONAIR
             A Number that defines the air friction of the body (air resistance). A value of 0 means the body will never
             slow as it moves through space. The higher the value, the faster a body slows when moving through space.
             The effects of the value are non-linear.
             */

            return Bodies.polygon(x, y, Math.round(Common.random(5, 8)), Common.random(40, 60), { friction: 1, restitution: 0.8, frictionStatic: 1 });
        });

        World.add(_world, _stack);
    };

    Demo.updateScene = function() {
        if (!_engine)
            return;

        _sceneWidth = window.screen.width;
        _sceneHeight = window.screen.height;

        var boundsMax = _engine.world.bounds.max,
            renderOptions = _engine.render.options,
            canvas = _engine.render.canvas;

        boundsMax.x = _sceneWidth;
        boundsMax.y = _sceneHeight;

        canvas.width = renderOptions.width = _sceneWidth;
        canvas.height = renderOptions.height = _sceneHeight;

        Demo[_sceneName]();
    };

    Demo.updateGravity = function () {
        if (!_engine)
            return;

        var orientation = typeof window.orientation !== 'undefined' ? window.orientation : 0,
            gravity = _engine.world.gravity;

        if (orientation === 0) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
            gravity.y = Common.clamp(event.beta, -90, 90) / 90;
        } else if (orientation === 180) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
            gravity.y = Common.clamp(-event.beta, -90, 90) / 90;
        } else if (orientation === 90) {
            gravity.x = Common.clamp(event.beta, -90, 90) / 90;
            gravity.y = Common.clamp(-event.gamma, -90, 90) / 90;
        } else if (orientation === -90) {
            gravity.x = Common.clamp(-event.beta, -90, 90) / 90;
            gravity.y = Common.clamp(event.gamma, -90, 90) / 90;
        }
    };

    Demo.applyForces = function (event) {
        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;

        if(_stack){
            for (var i = 0; i < _stack.length; i++){
                var theBody = _stack[i];
                Body.applyForce(theBody, { x: 0, y: 0 }, {x: (x*0.1)^2, y: (y*0.1)^2});
            }

        }


    };

    Demo.fullscreen = function(){
        if (!_engine)
            return;

        var _fullscreenElement = _engine.render.canvas;

        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
            if (_fullscreenElement.requestFullscreen) {
                _fullscreenElement.requestFullscreen();
            } else if (_fullscreenElement.mozRequestFullScreen) {
                _fullscreenElement.mozRequestFullScreen();
            } else if (_fullscreenElement.webkitRequestFullscreen) {
                _fullscreenElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        }
    };

    Demo.pushCollisions = function(event) {

        for (var i = 0; i < _bodiesToBeMovedNextFrame.length; i++){
            var theBody = _bodiesToBeMovedNextFrame[i];
            Body.applyForce(theBody, { x: 0, y: 0 }, {x: 0.0001, y: 0.0001});
        }

        _bodiesToBeMovedNextFrame = [];
    };

    Demo.onCollisionStart = function(event) {
        var pairs = event.pairs;
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            if (pair.bodyA.label !== 'world-bounds'){
                _bodiesToBeMovedNextFrame.push(pair.bodyA);
                //console.log(pair.collision.axisBody.angularVelocity);

                if(pair.collision.axisBody.angularVelocity > 0.01){
                    Demo.playRandomSound(pair.collision.axisBody.angularVelocity*100);
                }


            }

            if(pair.bodyB.label !== 'world-bounds'){
                _bodiesToBeMovedNextFrame.push(pair.bodyB);
            }
        }
    };

    Demo.reset = function() {
        var _world = _engine.world;

        World.clear(_world);
        Engine.clear(_engine);

        _world.gravity.scale = 0.01;

        var offset = 5;
        World.addBody(_world, Bodies.rectangle(_sceneWidth * 0.5, -offset, _sceneWidth + 0.5, 50.5, { isStatic: true, label: "world-bounds" }));
        World.addBody(_world, Bodies.rectangle(_sceneWidth * 0.5, _sceneHeight + offset, _sceneWidth + 0.5, 50.5, { isStatic: true, label: "world-bounds" }));
        World.addBody(_world, Bodies.rectangle(_sceneWidth + offset, _sceneHeight * 0.5, 50.5, _sceneHeight + 0.5, { isStatic: true, label: "world-bounds" }));
        World.addBody(_world, Bodies.rectangle(-offset, _sceneHeight * 0.5, 50.5, _sceneHeight + 0.5, { isStatic: true, label: "world-bounds" }));



    };

    Demo.playRandomSound = function(vol) {

        var rand = Math.floor(Math.random() * (5 - 1 + 1)) + 1;

        switch(rand){
            case 1:
                _sound.volume(vol,'clink1');
                _sound.play('clink1');
                break;
            case 2:
                _sound.volume(vol,'clink2');
                _sound.play('clink2');
                break;
            case 3:
                _sound.volume(vol,'clink3');
                _sound.play('clink3');
                break;
            case 4:
                _sound.volume(vol,'clink4');
                _sound.play('clink4');
                break;
            case 5:
                _sound.volume(vol,'clink5');
                _sound.play('clink5');
                break;
        }

    };

})();