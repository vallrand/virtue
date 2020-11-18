# Virtue

[![github-pages Status](https://github.com/vallrand/virtue/workflows/github-pages/badge.svg)](https://github.com/vallrand/virtue/actions)

First Person 3D Walking demo.

[Demo](http://vallrand.github.io/virtue/index.html)

### Development
```sh
npm install
npm run build
npm run start
```

Open Browser at `http://127.0.0.1:8888`

### Pipeline

3D models are in [FBX ASCII](https://code.blender.org/2013/08/fbx-binary-file-format-specification/) format

### Supported Features

  - Deferred background task processing
  - Runtime lightmap generation
  - Runtime navigation mesh construction
  - Decals
  - GPU accelerated particle systems
  - Physics engine
  - 3D audio
  - DQ skinning (skeletal animation)

### Debug Display

| URL Parameter | Description |
| ------ | ------ |
| physics | Render physics geometry |
| navigation | Render navigation mesh |
| raycast | Enable camera raycast |
| lights | Display light sources |
| decals | Show bounding boxes for decals |