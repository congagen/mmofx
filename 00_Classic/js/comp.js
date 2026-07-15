var x, y, gX, gY, xAxis, yAxis;
var idList = 1;
var color = d3.scaleOrdinal(d3.schemeCategory10);
var line;

var layers = {};
let mainData = [
  {
    "data": [

    {
        "LAYER_ID": 1,
        "DATAPOINT_ID": 1,
        "VALUE_NUMERIC": 1,
        "DATA_DATE": "07/01/2016"
    },

    {
        "LAYER_ID": 1,
        "DATAPOINT_ID": 2,
        "VALUE_NUMERIC": 0.5,
        "DATA_DATE": "07/02/3000"
    },

    {
        "LAYER_ID": 1,
        "DATAPOINT_ID": 3,
        "VALUE_NUMERIC": 0.5,
        "DATA_DATE": "07/28/4000"
    }

    ],

    "metric": {
      "METRIC_ID": 1,
      "INDICATOR_ID": 1,
      "NAME": "",
      "DESCRIPTION": "",
      "Y_AXIS_NAME": "",
      "UNIT_ID": 1,
      "TIMING_ID": null,
      "SORT_ORDER": 2,
      "AUTOMATED": "Y",
      "ASSIGNED_USER": null,
      "META_NUMERIC_1_TITLE": null,
      "META_VARCHAR_1_TITLE": null,
      "GOAL_NUMERIC": null,
      "TARGET_OTHER": null,
      "TARGET_OTHER_NAME": null,
      "TARGET_OTHER_COLOR": null,
      "CHART_TYPE": null,
      "CHART_SCALE": null,
      "CHART_INTERVAL": null,
      "QUERY": null,
      "QUERY_FIELDS": null,
      "METRIC_SOURCE": null,
      "WIDGET_SETTINGS": "{\r\n    \"detail\":{\r\n        \"type\":\"bar\"\r\n    }\r\n}",
      "IND_NAME": "",
      "AREA_NAME": ""
    }
  }
]

var currentLayer = 1;
var interactionMode = "draw";
var svg = d3.select("svg");

var settings = {
    targets:[],
    detail:{
        type:"line"
    }
};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function drawCircle(svg, x, y, size) {
    // console.log('Drawing circle at', x, y, size);
    // console.log(data[0]["data"]);

    svg.append("circle")
      .attr('class', 'click-circle')
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size);
}

// d3.json("data.json", function(data) {

if(mainData[0].metric.WIDGET_SETTINGS != ""){
    var wid = JSON.parse(mainData[0].metric.WIDGET_SETTINGS);
    if(wid != null && typeof wid.line != 'undefined'){
        $.extend(settings, wid.line);
    }
    if(wid != null){
        $.extend(settings, wid);
    }
}

var limits  = {maxY:null, minY:null, maxX:null, minX:null};
var padding = {top:30,bottom:30,left:30,right:30};

var width = + svg.attr("width");
var height = + svg.attr("height");

var canvasHeight = height-padding.top-padding.bottom;
var canvasWidth  = width-padding.left-padding.right;

var eMaxY = d3.max("Y_MAX", function(d) {return 1;});
var eMinY = d3.min("Y_MIN", function(d) {return 0;});
var eMaxX = d3.max("X_MAX", function(d) {return new Date("01/01/10000");});
var eMinX = d3.min("X_MIN", function(d) {return new Date("12/01/0");});

if(limits.maxX == null){ limits.maxX = eMaxX;}
else { if(eMaxX > limits.maxX){ limits.maxX = eMaxX;}}

if(limits.minX == null){ limits.minX = eMinX;}
else { if(eMinX < limits.minX){ limits.minX = eMinX;}}

if(limits.maxY == null){limits.maxY = eMaxY;}
else { if(eMaxY > limits.maxY){limits.maxY = eMaxY;}}

if(limits.minY == null){limits.minY = eMinY;}
else { if(eMinY < limits.minY){limits.minY = eMinY;}}

settings.targets.forEach(function(d) {
    if (limits.maxY < d.value) { limits.maxY = d.value; }
    if (limits.minY > d.value) { limits.minY = d.value; }
});

var canvas = svg.append("g")
  .attr("id","canvas")
  .attr("width", canvasWidth)
  .attr("height", canvasHeight)
  .attr("transform","translate(" + padding.left + "," + padding.top + ")");

x = d3.scaleTime().domain([limits.minX, limits.maxX]).range([0, +canvas.attr("width")]);
y = d3.scaleLinear().domain([limits.maxY * 1.1, limits.minY - (limits.minY * 0.1)]).range([0, +canvas.attr("height")]);

line = d3.line().x(function(d) { return  x(new Date(d.DATA_DATE)); }).y(function(d) {
  return  y( + d.VALUE_NUMERIC);
});

var zoom = d3.zoom().on("zoom", zoomed);
xAxis = d3.axisBottom(x);
yAxis = d3.axisLeft(y);

canvas.selectAll(".targets")
  .data(settings.targets)
  .enter()
    .append("line")
    .classed("targets", true)
    .style("stroke",function(d){return d.color;})
    .style("stroke-width",1)
    .attr("x1",x(limits.minX))
    .attr("x2",x(limits.maxX))
    .attr("y1",function(d){return y(+d.value);})
    .attr("y2",function(d){return y(+d.value);});

var clip = canvas.append("clipPath")
  .attr("id","clip")
  .append("rect")
  .attr("width",canvasWidth)
  .attr("height",canvasHeight);

gX = canvas.append("g")
  .attr("transform","translate(0,"+(+canvas.attr("height"))+")")
  .attr("class","axis axis--x")
  .call(xAxis);

gY = canvas.append("g").attr("class","axis axis--y").call(yAxis);
d3.selectAll(".axis--y > g.tick > line").attr("x2",canvasWidth).style("stroke","lightgrey");

if (settings.detail.type == "line") {
  var lines = canvas.selectAll("path.line")
    .data(data)
    .enter()
    .append("path")
    .attr("clip-path", "url(#clip)")
    .classed("line",true)
    .style("stroke", function(d){ return color(1)})
    .attr("d",function(d){
      return line(d.data);
  });
} else if(settings.detail.type == "bar"){
  barWidth = (x(new Date("2016-01-02")) - x(new Date("2016-01-01")));
  var barLines = canvas.selectAll("rect.bar")
    .data(mainData[0].data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("clip-path", "url(#clip)")
    .attr("x", function(d){return x(new Date(d.DATA_DATE)) - barWidth * 0.5;})
    .attr("width", barWidth)
    .attr("height", function(d){return canvasHeight - y(d.VALUE_NUMERIC);})
    .attr("y", function(d){return y(d.VALUE_NUMERIC);})
    .style("fill", "steelblue")
    .style("stroke", "blue")
    .style("stroke-width", "1px");
}


function updateGraph() {
    if (settings.detail.type == "line") {
      var lines = canvas.selectAll("path.line")
        .data(data)
        .enter()
        .append("path")
        .attr("clip-path", "url(#clip)")
        .classed("line",true)
        .style("stroke", function(d){ return color(1)})
        .attr("d",function(d){
          return line(d.data);
      });
    } else if(settings.detail.type == "bar"){
      barWidth = (x(new Date("2016-01-02")) - x(new Date("2016-01-01")));
      var barLines = canvas.selectAll("rect.bar")
        .data(mainData[0].data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("clip-path", "url(#clip)")
        .attr("x", function(d){return x(new Date(d.DATA_DATE)) - barWidth * 0.5;})
        .attr("width", barWidth)
        .attr("height", function(d){return canvasHeight - y(d.VALUE_NUMERIC);})
        .attr("y", function(d){return y(d.VALUE_NUMERIC);})
        .style("fill", "steelblue")
        .style("stroke", "blue")
        .style("stroke-width", "1px");
    }
}


function zoomed() {
    gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    var new_x = d3.event.transform.rescaleX(x);

    if(settings.detail.type == "line"){
      line.x(function(d) { return  new_x(new Date(d.DATA_DATE));})

      d3.select("#canvas").selectAll("path.line").data(mainData).attr("d",function(d){
            return line(d.data);
        });
    } else if(settings.detail.type == "bar"){
        barWidth = new_x(new Date("2016-01-02")) - new_x(new Date("2016-01-01"));

        d3.select("#canvas").selectAll("rect.bar")
          .data(mainData[0].data).attr("x",function(d){return new_x(new Date(d.DATA_DATE)) - barWidth * 0.5;})
          .attr("width",barWidth);
    }
}

svg.on('click', function() {
    var coords = d3.mouse(this);
    var xValMouse = x.invert(d3.mouse(this)[0]);
    var yValMouse = y.invert(d3.mouse(this)[1]);

    let xYear = xValMouse.getYear().toString();
    let xMonth = xValMouse.getMonth().toString();
    let xDay = xValMouse.getDay().toString();
    let comp = xMonth + "/" + xDay + "/" + xYear;

    if (!layers.hasOwnProperty(currentLayer)) {
      layers[currentLayer] = [];
    }

    if (interactionMode == "draw") {
      let itm = {
        "LAYER_ID": 1,
        "DATAPOINT_ID": mainData[0]["data"].length + 1,
        "VALUE_NUMERIC": yValMouse,
        "DATA_DATE": comp
      }

      mainData[0]["data"].push(itm);
    }

    console.log(mainData);
    updateGraph();
});

svg.call(zoom);
