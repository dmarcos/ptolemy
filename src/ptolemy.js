;(function() {

    // Oculus Rift Effect
    var effect;

    // store the time of the script start
    var time = new Date().getTime();

    var camera
      , scene
      , renderer
      , video = false
      , photo = false
      , texture
      , lat
      , lon
      , fov;

    window.ptolemy = function() {

        //create mediaPlayer
        createMediaPlayer();
        return this;
    };

    function createMediaPlayer(options){

        self = this;

        // create ThreeJS scene
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

        // create ThreeJS renderer and append it to our object
        renderer = new THREE.WebGLRenderer();
        renderer.autoClear = false;
        renderer.setClearColor( 0xffffff, 1 );
        effect = new THREE.OculusRiftEffect( renderer );

        document.querySelector('body').appendChild(renderer.domElement);

        if(document.querySelector('body').getAttribute('data-photo-src')) {
            photo = document.createElement( 'img' );
        } else {
            // create off-dom video player
            video = document.createElement( 'video' );
            video.loop = true;
            video.muted = true;
        }

        // create ThreeJS texture and high performance defaults
        if(photo != false) {
            texture = new THREE.Texture( photo );
        } else {
            texture = new THREE.Texture( video );
        }

        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;

        // create ThreeJS mesh sphere onto which our texture will be drawn
        mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 80, 50 ), new THREE.MeshBasicMaterial( { map: texture } ) );
        mesh.scale.x = -1; // mirror the texture, since we're looking from the inside out
        scene.add(mesh);

        if(video != false) {

            // attach video player event listeners
            video.addEventListener("ended", function(e) {
                console.log("video loaded");
            });

            // Progress Meter
            video.addEventListener("progress", function(e) {
                var percent = null;
                    if (video && video.buffered && video.buffered.length > 0 && video.buffered.end && video.duration) {
                        percent = video.buffered.end(0) / video.duration;
                    }
                    // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
                    // to be anything other than 0. If the byte count is available we use this instead.
                    // Browsers that support the else if do not seem to have the bufferedBytes value and
                    // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
                    else if (video && video.bytesTotal != undefined && video.bytesTotal > 0 && video.bufferedBytes != undefined) {
                        percent = video.bufferedBytes / video.bytesTotal;
                    }

                    var cpct = Math.round(percent * 100);
                    if(cpct == 100) {
                        // do something now that we are done
                    } else {
                        // do something with this percentage info (cpct)
                    }
            });

            // Video Play Listener, fires after video loads
            video.addEventListener("canplaythrough", function(e) {

                video.play();
                animate();
                console.log("playing");
            });

            // set the video src and begin loading
            video.src =  document.querySelector('body').getAttribute('data-video-src');
        } else if(photo != false) {
            photo.onload = animate;
            photo.crossOrigin='anonymous';
            photo.src =  document.querySelector('body').getAttribute('data-photo-src');
        }

    }

    //Exposed functions
    function play() {
      //code to play media
      video.play()
    }

    function loadVideo(videoFile) {
        video.src = videoFile;
    }

    function animate() {
        // set our animate function to fire next time a frame is ready
        requestAnimationFrame( animate );

        if ( video.readyState === video.HAVE_ENOUGH_DATA) {
            if(typeof(texture) != "undefined" ) {
                var ct = new Date().getTime();
                if(ct - time >= 30) {
                    texture.needsUpdate = true;
                    time = ct;
                }
            }
        }

        render();

    }

    var vrstate = new vr.State();
    function render() {

        lat = Math.max( - 85, Math.min( 85, lat ) );
        phi = ( 90 - lat ) * Math.PI / 180;
        theta = lon * Math.PI / 180;

        var cx = 500 * Math.sin( phi ) * Math.cos( theta );
        var cy = 500 * Math.cos( phi );
        var cz = 500 * Math.sin( phi ) * Math.sin( theta );

        camera.position.x = - cx;
        camera.position.y = - cy;
        camera.position.z = - cz;

        // Poll VR, if it's ready.
        var polled = vr.pollState(vrstate);
        //renderer.clear();
        //renderer.render( scene, camera );
        effect.render( scene, camera, polled ? vrstate : null );

    }

})();