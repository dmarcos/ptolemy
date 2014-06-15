(function() {

  var PTOLEMY = window.PTOLEMY = {};

  // Oculus Rift Effect
  var effect;

  // store the time of the script start
  var time = new Date().getTime();

  var camera;
  var scene;
  var renderer;
  var video = false;
  var photo = false;
  var texture;
  var material;
  var lat;
  var lon;
  var fov;

  PTOLEMY.displayMedia = displayMedia;

  function displayMedia(mediaURL, type, el) {
    type = type || 'video';
    self = this;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    scene = new THREE.Scene();

    // create ThreeJS renderer and append it to our object
    renderer = new THREE.WebGLRenderer({
      devicePixelRatio: 1,
      alpha: false,
      clearColor: 0xffffff,
      antialias: true
    });
    renderer.autoClear = false;
    renderer.setClearColor(0xffffff, 1);
    effect = new THREE.OculusRiftEffect(renderer);

    el.appendChild(renderer.domElement);

    if (type !== 'video') {
      photo = document.createElement('img');
    } else {
      // create off-dom video player
      video = document.createElement('video');
      video.loop = true;
      video.muted = true;
    }

    // create ThreeJS texture and high performance defaults
    if (type !== 'video') {
      texture = new THREE.Texture(photo);
    } else {
      texture = new THREE.Texture(video);
    }

    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    material = new THREE.MeshBasicMaterial({
      map: texture
    });

    // create ThreeJS mesh sphere onto which our texture will be drawn
    mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 80, 50), material);
    mesh.scale.x = -1; // mirror the texture, since we're looking from the inside out
    scene.add(mesh);

    if (type === 'video') {
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
        if (cpct == 100) {
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
      video.src = mediaURL;
    } else if (type !== 'video') {
      photo.onload = animate;
      photo.crossOrigin = 'anonymous';
      photo.src = mediaURL;
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
    requestAnimationFrame(animate);
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (typeof(texture) != "undefined") {
        var ct = new Date().getTime();
        if (ct - time >= 30) {
          texture.needsUpdate = true;
          time = ct;
        }
      }
    }
    render();
  }

  var vrstate = new vr.State();

  function render() {
    lat = Math.max(-85, Math.min(85, lat));
    phi = (90 - lat) * Math.PI / 180;
    theta = lon * Math.PI / 180;

    var cx = 500 * Math.sin(phi) * Math.cos(theta);
    var cy = 500 * Math.cos(phi);
    var cz = 500 * Math.sin(phi) * Math.sin(theta);

    camera.position.x = -cx;
    camera.position.y = -cy;
    camera.position.z = -cz;

    // Poll VR, if it's ready.
    var polled = vr.pollState(vrstate);
    effect.render(scene, camera, polled ? vrstate : null);
  }

  // Drag and drop event listeners
  document.addEventListener('dragover', function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, false);

  document.addEventListener('dragenter', function(event) {
    document.body.style.opacity = 0.5;
  }, false);

  document.addEventListener('dragleave', function(event) {
    document.body.style.opacity = 1;
  }, false);

  document.addEventListener('drop', function(event) {
    event.preventDefault();

    var reader = new FileReader();
    reader.addEventListener('load', function(event) {
      material.map.image.src = event.target.result;
      material.map.needsUpdate = true;
    }, false);

    reader.readAsDataURL(event.dataTransfer.files[0]);
    document.body.style.opacity = 1;
  }, false);

})();