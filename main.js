var numLayers=20; // number of layers
var numSamples = 200; // number of samples per layer
var mode=0;
var colorbase=[150,100,100];
var width = 1400, height = 600;
var arr = [];
var wunit;
var lastrawdata ;
var dataset;
var minvalue;
var maxvalue ;
var hunit ;
var count = 0;
var svg = null;


function init()
{
    for(var i = 0; i < numLayers; i++){
        arr.push(i);
    }
    wunit = width / numSamples; //width unit
    lastrawdata = arr.map(function(){ return bumpLayer(numSamples); }); //generate random data
    dataset = stack(lastrawdata);
    minvalue = 0 - getMin(dataset[0]); //min value in the bottom layer
    maxvalue = getMax(dataset[dataset.length-1]); //max value in the top layer
    hunit = height/ (minvalue+maxvalue); //height unit
    scale(dataset);
}

window.onload = function(){
    init();
    svg = document.getElementById("graph");
    svg.setAttribute("width",  width );
    svg.setAttribute("height", height);
    for(var i = 0; i < numLayers; i++){
        var path = document.createElementNS("http://www.w3.org/2000/svg","path");
        var str = genPath(dataset[i],dataset[i+1]);
        var r = Math.floor((i+1)/numLayers*100) +  colorbase[0];
        var g = Math.floor((i+1)/numLayers*100) +  colorbase[1];
        var b = Math.floor((i+1)/numLayers*100) + colorbase[2];
        path.setAttribute("class","mypath");
        path.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
        path.setAttribute("stroke", "gray");
        path.setAttribute("stroke-width", "0px");
        path.setAttribute("d", str);//draw a layer

        svg.appendChild(path);
    }
    console.log(svg);
};

function changeColor(temp)
{
    if(temp===0)
    {
        colorbase=[150,100,100];
        display(dataset);
    }else if(temp===1)
    {
        colorbase=[100,150,100];
        display(dataset);
    }else if(temp===2)
    {
        colorbase=[100,100,150];
        display(dataset);
    }

}
function changeMode(temp)
{
    console.log("changemode");
    if(temp===0)
    {
        mode=0;
        transition(0);
    }else if(temp===1)
    {
        mode=1;
        transition(0);
    }else if(temp===2)
    {
        mode=2;
        transition(0);
    } else if(temp===3)
    {
        mode=3;
        transition(0);
    }
}

function stack(data){
  // console.log(data);
    var arr = [[]];
    var d = [];
    var buffer_i;
    var buffer_j;
    for(var i = 0; i < data.length; i++){
        d.push([]);
        for(var j = 0; j < data[i].length; j++){
            if(j === 0){
                d[i].push(0);
            }
            else{
                d[i].push(data[i][j].y - data[i][j-1].y);// Difference of two adjacent sample in layer i
            }
        }
    }

    for(var i = 0; i < data[0].length; i++){//baseline
        arr[0].push({x:data[0][i].x, y:data[0][i].y});
    }


    for(var i = 1; i < data.length; i++){
        for(var j = 0; j < data[i].length; j++){
            arr[0][j].y += data[i][j].y;//add all layers' y value for every simple point
        }
    }
    if(mode===0)
    {
        //traditional graph
        for(var k = 0; k < arr[0].length; k++){
            arr[0][k].y=0;
        }
    }else if(mode===1) {
        //ThemeRiver algorithm
        for (var k = 0; k < arr[0].length; k++) {
            buffer_j = 0;
            for (var i = 0; i < data.length; i++) {
                buffer_j += d[i][k];
            }
            arr[0][k].y = (-1 / 2) * buffer_j;
        }

    }else if(mode===2)
    {
        //wiggle algorithm
        for (var k = 0; k < arr[0].length; k++) {
            buffer_j = 0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j <= i - 1; j++) {
                    buffer_j += d[j][k];
                }
            }
            // the point that can minimizes the wiggle
            arr[0][k].y = (-1 / (data.length+1)) * buffer_j;
        }
    } else if(mode===3)
    {
        //weighted_wiggle algorithm
        for (var k = 0; k < arr[0].length; k++) {
            buffer_i = 0;
            for (var i = 0; i < data.length; i++) {
                buffer_j = 0;
                for (var j = 0; j <= i - 1; j++) {
                    buffer_j += d[j][k];
                }
                //buffer_j: accumulate difference from 0~i-1
                buffer_i += (buffer_j + d[i][k] * 0.5) * data[i][k].y;
            }
            // the point that can minimizes the wiggle
            arr[0][k].y = (-1 / arr[0][k].y) * buffer_i; // inverse y and strench
        }
    }

    for(var k = 1; k < arr[0].length; k++){
        // baseline
        arr[0][k].y += arr[0][k-1].y; //accumulate.
    }
    for(var i = 0; i < data.length; i++){
        arr.push([]);
        for(var j = 0; j < data[i].length-1; j++){
            //update a layer:  y is based on original data and the last layer
            arr[arr.length - 1].push({x:data[i][j].x, y:data[i][j].y+arr[arr.length - 2][j].y});
        }
    }
    return arr;
}
function scale(data){//scale the data 
    for(var i = 0; i < data.length; i++){
        for(var j = 0; j < data[i].length; j++){
            data[i][j].x *= wunit;
            data[i][j].y = (-data[i][j].y + maxvalue) * hunit;
            //data[i][j].y = (data[i][j].y + minvalue) * hunit
        }
    }
}
function transition(flag) {//update
    if(flag===1)
    {
        //generate new dataset
        lastrawdata=arr.map(function(){ return bumpLayer(numSamples); });
    }

    var newdataset = stack(lastrawdata);
    minvalue = 0 - getMin(newdataset[0]);
    maxvalue = getMax(newdataset[newdataset.length-1]);
    hunit = height / (minvalue+maxvalue);
    scale(newdataset);
    var part = 200;
    var period = 10;
    for(var i = 0; i <= part; i++){
        setTimeout(function(){display(getMiddlePoint(dataset, newdataset, part)); if(count > part){ dataset = newdataset;}}, i*period);
    }
}
function genPath(g0, g1){ //path for drawing
    var str = "M" + g1[0].x + "," + g1[0].y;
    for(var i = 1; i < g1.length; i++){ //from left to right
        str += "L" + g1[i].x + "," + g1[i].y;
    }
    for(var i = g0.length - 1; i >= 0; i--){ //from right to left
        str += "L" + g0[i].x + "," + g0[i].y;
    }
    return str;
}
// Lee Byron's test data generator.
function bumpLayer(num) {

    function bump(a) {
        var x = 1 / (.1 + Math.random()), // 0.9~10 
            y = 2 * Math.random() - .5, // -0.5~ 1.5 
            z = 10 / (.1 + Math.random()); //  9 ~ 100
        for (var i = 0; i < num; i++) {
            var w = (i / num - y) * z;
            a[i] += x * Math.exp(-w * w);
        }
    }

    var a = [], i;
    for (i = 0; i < num; ++i) a[i] = 0;
    for (i = 0; i < 5; ++i) bump(a);
   
    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
}

function getMax(layer){
    var max = -99999;
    for(var i = 0; i < layer.length; i++){
        if(max < layer[i].y){
            max = layer[i].y;
        }
    }
    return max;
}
function getMin(layer){
    var min = 99999;
    for(var i = 0; i < layer.length; i++){
        if(min > layer[i].y){
            min = layer[i].y;
        }
    }
    return min;
}
function display(dataset){ //draw temporary graph
    for(var i = 0; i < numLayers; i++){
        var path = svg.getElementsByTagName("path")[i];
        var str = genPath(dataset[i],dataset[i+1]);
        var r = Math.floor((i+1)/numLayers*100) +  colorbase[0];
        var g = Math.floor((i+1)/numLayers*100) +  colorbase[1];
        var b = Math.floor((i+1)/numLayers*100) + colorbase [2];
        path.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
        path.setAttribute("d", str);
    }
    count++;
}
function getMiddlePoint(origin, last, part){
    if(count > part) {
        count = 0;
    }
    var middle = [];
    for(var i = 0; i < origin.length; i++){
        middle.push([]);
        for(var j = 0; j < origin[i].length; j++){// for every samples per layer, interpolate the y
            middle[i].push({x:last[i][j].x, y:(origin[i][j].y+(count/part)*(last[i][j].y - origin[i][j].y))});
        }
    }
    return middle;
}