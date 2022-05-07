$(e => {

    // TODO: share, 3d

    mapboxgl.accessToken = 'pk.eyJ1IjoiM2RidWlsZGluZ3MiLCJhIjoiY2syemRldWFvMDdueDNtcWpiNG8zajhhZSJ9.Zy2CUldC8U-RjcrAvtP6ZA';
    const selectionColor = [186, 225, 207];
    const searchEndpoint = `${config.endpoint}/search/?query={query}`;
    const statsEndpoint = `${config.endpoint}/data/pricing/?region={region}`;
    const maxWidthMobile = 760;


    //*** GENERAL ***************************************************************

    if (params.back) {
        $('#button-back').click(e => {
            location.href = decodeURIComponent(params.back);
        });

        $(window).on('keydown', e => {
            if (e.which === 27) {
                location.href = decodeURIComponent(params.back);
            }
        });

        $('#back').fadeIn();
    }


    //*** MAP *********************************************************************

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'style.json', // config.mapEndpoint,
        //style: 'https://data.3dbuildings.com/tile/style/3dbuildings+mapbox.json?token=dixw8kmb',
        center: [113.32072, 23.11804],
        zoom: 14.61,
        bearing: 0,
        pitch: 59,
        attributionControl: true,
        hash: true,
        antialias: false
    });

    map.on('load', function() {

        var toggleableLayerIds = ['building-footprint', 'building', "building-cluster", "building-point"];
        var link = document.getElementById('toglayer'); /* 创建a标签 */
        link.onclick = function(e) { /* 设置onclick事件回调函数 */

            e.preventDefault();
            e.stopPropagation();


            for (var i = 0; i < toggleableLayerIds.length; i++) {
                var id = toggleableLayerIds[i];
                var clickedLayer = id;

                var visibility = map.getLayoutProperty(clickedLayer, 'visibility'); /* getLayoutProperty(layer, name) 返回指定style layer上名为name的layout属性的值*/

                if (visibility == undefined) {
                    visibility = "visible";
                }

                if (visibility === 'visible') {

                    map.setLayoutProperty(clickedLayer, 'visibility', 'none'); /* setLayoutProperty(layer, name, value)设置指定layer上名为name的layou属性的值 */
                    link.innerHTML = "3D"

                } else {

                    link.innerHTML = "2D"
                    map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                }

            }


        };


    });




    $('#map-button-zoomin').click(e => {
        map.zoomIn();
    });

    $('#map-button-zoomout').click(e => {
        map.zoomOut();
    });

    $('#map-button-fullscreen').click(e => {
          
        if (e.currentTarget.className == "map-button-fullscreen") {
            $('#map-button-fullscreen').removeClass("map-button-fullscreen")
            $('#map-button-fullscreen').addClass("map-button-exitfullscreen")
            requestFullscreen();
        } else {
            $('#map-button-fullscreen').addClass("map-button-fullscreen")
            $('#map-button-fullscreen').removeClass("map-button-exitfullscreen")
            exitFullScreen();
        }

    });




    map.on('click', 'building', (e) => {


        console.log(e.features[0])


    });



    //  map.on("click", (e) => {
    //    console.log(e)
    //  var features = map.queryRenderedFeatures(e.point, {
    // layers: ["unclustered-point"],
    //});
    // });

   function requestFullscreen() {
        const docElm = document.documentElement
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen()
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen()
        } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen()
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen()
        }
    };


   function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen()
        }
    };




    function moveMapToBBox(bbox) {
        let padding = {};
        if (innerWidth > maxWidthMobile) {
            padding = { left: 430, top: 50, right: 50, bottom: 50 }
        } else {
            padding = { left: 35, top: 35, right: 35, bottom: 70 }
        }

        const view = map.cameraForBounds([
            [bbox.w, bbox.s],
            [bbox.e, bbox.n]
        ], { padding });
        map.jumpTo({ ...view, bearing: 0, pitch: 0 });
    }

    function moveMapToPoint(point) {
        const lonPadding = 0.001 / Math.cos(point[1] * Math.PI / 180);
        const latPadding = 0.001;

        const bbox = {
            w: point[0] - lonPadding,
            s: point[1] - latPadding,
            e: point[0] + lonPadding,
            n: point[1] + latPadding
        };

        return moveMapToBBox(bbox);
    }

    // map.setPaintProperty('building', 'fill-extrusion-height', ["number", ["get", "height"], 1]);
    //
    // map.setPaintProperty('building', 'fill-extrusion-height', [
    // "match",
    // ["string", ["get", "heightSrc"], ""],
    // "ai", 1,
    // ["number", ["get", "height"], 1]
    // ]);

    //*** SELECTION ***************************************************************

    const selectionStyle = {
        lineColor: `rgba(${selectionColor}, 1)`,
        fillColor: `rgba(${selectionColor}, 0.2)`,
        handleColor: `rgba(${selectionColor}, 1)`
    };

    const selection = new Selection(map, selectionStyle, 'landuse');

    selection.on('change', bbox => {
        search.value = '';
        getStatsByBBox(bbox).then(feature => {
            stats.show(feature);
        });
    });

    $('#map-button-select').click(e => {
        const bounds = map.getBounds();
        const bbox = { w: bounds.getWest(), s: bounds.getSouth(), e: bounds.getEast(), n: bounds.getNorth() };
        getStatsByBBox(bbox).then(feature => {
            selection.setBBox(bbox);
            moveMapToBBox(bbox);
            stats.show(feature);
        });
    });

    if (params.query) {
        delete params.region;
        delete params.bbox;
        params.write();
    }

    if (params.region) {
        delete params.bbox;
        params.write();
        getStatsByID(params.region).then(feature => {
            selection.setPolygon(feature.geometry);
            const bounds = Bounds.fromGeometry(feature.geometry);
            const bbox = { w: bounds.min[0], s: bounds.min[1], e: bounds.max[0], n: bounds.max[1] };
            moveMapToBBox(bbox);
            stats.show(feature);
        });
    }

    if (params.bbox) {
        const match = params.bbox.match(/^([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)$/);
        if (match) {
            const bbox = { w: parseFloat(match[1]), s: parseFloat(match[2]), e: parseFloat(match[3]), n: parseFloat(match[4]) };

            map.on('style.load', e => {
                getStatsByBBox(bbox).then(feature => {
                    selection.setBBox(bbox);
                    moveMapToBBox(bbox);
                    stats.show(feature);
                });
            });
        }
    }


    //*** STATS *******************************************************************

    const stats = new Stats($('#stats'), $('#stats-trigger'), maxWidthMobile);

    function getStatsByBBox(bbox) {
        delete params.query;
        delete params.region;
        params.bbox = `${bbox.w},${bbox.s},${bbox.e},${bbox.n}`;
        params.write();

        return new Promise(resolve => {
            const url = statsEndpoint.replace('{region}', `${bbox.w},${bbox.s},${bbox.e},${bbox.n}`);
            Request.get(url).then(geojson => {
                resolve(geojson.features[0]);
            });
        });
    }

    function getStatsByID(id) {
        return new Promise(resolve => {
            const url = statsEndpoint.replace('{region}', `${id.replace('-', '/')}`);
            Request.get(url).then(geojson => {
                resolve(geojson.features[0]);
            });
        });
    }


    //*** SEARCH ******************************************************************

    // const search = new Search($('#search'), config.searchEndpoint);
    const search = new Search($('#search'), searchEndpoint);

    search.on('submit', query => {

        params.query = encodeURIComponent(query);
        delete params.region;
        delete params.bbox;
        params.write();
    });

    search.on('select', feature => {
        const properties = feature.properties;
        const bounds = Bounds.fromGeometry(feature.geometry);

        if (!properties.stats) {
            selection.clear();
            stats.hide();
            moveMapToPoint(bounds.center);
            return;
        }

        // a known region: Germany, London
        if (feature.id) {
            selection.setPolygon(feature.geometry);
            const bbox = { w: bounds.min[0], s: bounds.min[1], e: bounds.max[0], n: bounds.max[1] };
            moveMapToBBox(bbox);
            stats.show(feature);
            return;
        }

        if (feature.properties.type === 'bbox') {
            const bbox = { w: bounds.min[0], s: bounds.min[1], e: bounds.max[0], n: bounds.max[1] };
            selection.setBBox(bbox);
            moveMapToBBox(bbox);
            stats.show(feature);
            return;
        }
    });

    map.on('click', e => {
        search.hideResults();
    });

    if (params.query) {
        search.value = decodeURIComponent(params.query);
        if (!params.bbox && !params.region) {
            search.submit();
        }
    }

});