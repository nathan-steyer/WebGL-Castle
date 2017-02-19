var gl, program;

var points = [];
var normals = [];

var modelViewMatrix;
var projectionMatrixLoc;
var modelViewMatrixLoc;
var modelViewStack = [];

var r = 20;
var zoom = 150;
var lr = 45;
var ud = 36;

var lightPosition = vec4(1, 2, -1, 0);
var lightAmbient, lightDiffuse, lightSpecular;
var materialAmbient, materialDiffuse, materialSpecular;
var materialShininess;

var castleW = 120;
var gateTowerW = 40;
var gateTowerH = 60;

var animateFlag = false;
var gateMov = 0;
var gateDir = 1;
var gateStep = (gateTowerH / 2) / 300;

/*
var mvTest = mult(mult(lookAt([0, 0, 8], [0, 2, 0], [0, 1, 0]), rotate(45, 0, 0, 1)), translate(1, 0, 1));
var projTest = ortho(-5, 5, -2, 6, -10, 10);
var newB = multiply(projTest, (multiply(mvTest, [0, 0, 4, 1])));
var newC = multiply(projTest, (multiply(mvTest, [4, 0, 4, 1])));
*/

function main()
{
    gl = WebGLUtils.setupWebGL(document.getElementById("gl-canvas"));
    gl.enable(gl.DEPTH_TEST);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    GenerateCube();
    GenerateTower();
    GenerateGateTower();
    SendData();

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    window.onkeydown = function(event)
    {
        switch(event.keyCode)
        {
            case 37:
                lr += 18;
                break;
            case 38:
                if (ud < 81)
                    ud += 9;
                break;
            case 39:
                lr -= 18;
                break;
            case 40:
                if (ud > 9)
                    ud -= 9;
                break;
            case 65:
                animateFlag = !animateFlag;
        }
    };

    render();
}

function GenerateCube()
{
    var cube = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];
    quad(cube[1], cube[0], cube[3], cube[2]);
    quad(cube[2], cube[3], cube[7], cube[6]);
    quad(cube[3], cube[0], cube[4], cube[7]);
    quad(cube[6], cube[5], cube[1], cube[2]);
    quad(cube[4], cube[5], cube[6], cube[7]);
    quad(cube[5], cube[4], cube[0], cube[1]);
}

function quad(a, b, c, d)
{
    points.push(a);
    points.push(b);
    points.push(c);
    points.push(a);
    points.push(c);
    points.push(d);

    var t1 = subtract(b, a);
    var t2 = subtract(d, a);
    var normal = normalize(vec3(cross(t1, t2)));
    for (var i = 0; i < 6; i++)
        normals.push(normal);
}

function GenerateTower()
{
    var tower = [
        vec4(0, -0.5, 0, 1),
        vec4(0.25, -0.5, 0, 1),
        vec4(0.25, 0.25, 0, 1),
        vec4(0.30, 0.25, 0, 1),
        vec4(0, 0.5, 0, 1)
    ];
    var slices = 100;
    var prev1, prev2;
    var curr1, curr2;

    for (var i = 0; i < 4; i++)
    {
        prev1 = tower[i];
        prev2 = tower[i+1];
        var r = rotate(360 / slices, 0, 1, 0);
        for (var j = 1; j <= slices; j++)
        {
            curr1 = multiply(r, prev1);
            curr2 = multiply(r, prev2);
            quad(prev1, prev2, curr2, curr1);
            prev1 = curr1;
            prev2 = curr2;
        }
    }
}

function GenerateGateTower()
{
    var GateTower = [
        vec4(-0.25, -0.5, 0.5, 1),
        vec4(-0.5, -0.5, 0.5, 1),
        vec4(-0.5, 0.5, 0.5, 1),
        vec4(0.5, 0.5, 0.5, 1),
        vec4(0.5, -0.5, 0.5, 1),
        vec4(0.25, -0.5, 0.5, 1)
    ];
    var slices = 45;
    var step = Math.PI / slices;
    for (var i = 0; i <= slices; i++)
        GateTower.push(vec4(0.25*Math.cos(i*step), 0.25*Math.sin(i*step) - 0.25, 0.5, 1));
    var numPoints = GateTower.length;
    for (i = 0; i < numPoints; i++)
        GateTower.push(vec4(GateTower[i][0], GateTower[i][1], GateTower[i][2] - 1));
    for (i = 0; i < numPoints - 1 ; i++)
        quad(GateTower[i], GateTower[i+1], GateTower[i+1+numPoints], GateTower[i+numPoints]);
    quad(GateTower[51], GateTower[0], GateTower[52], GateTower[103]);

    quad(GateTower[2], GateTower[1], GateTower[0], GateTower[51]);
    for (i = 51; i > 29; i -= 2)
        quad(GateTower[2], GateTower[i], GateTower[i-1], GateTower[i-2]);
    quad(GateTower[2], GateTower[29], GateTower[28], GateTower[3]);
    for (i = 28; i > 6; i -= 2)
        quad(GateTower[3], GateTower[i], GateTower[i-1], GateTower[i-2]);
    quad(GateTower[3], GateTower[6], GateTower[5], GateTower[4]);
}

function SendData()
{
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function SetupLightingMaterial()
{
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projectionMatrix = ortho(-zoom, zoom, -zoom, zoom, -1000, 1000);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    var eye = vec3(
        r * Math.cos(ud/180 * Math.PI) * Math.cos(lr/180 * Math.PI),
        r * Math.sin(ud/180 * Math.PI),
        r * Math.cos(ud/180 * Math.PI) * Math.sin(lr/180 * Math.PI)
    );
    modelViewMatrix = lookAt(eye, [0, 0, 0], [0, 1, 0]);

    DrawGround();
    DrawTower(20, 60, castleW, castleW);
    DrawTower(20, 60, castleW, -castleW);
    DrawTower(20, 60, -castleW, castleW);
    DrawTower(20, 60, -castleW, -castleW);
    DrawWall(38, 10, 2*castleW, 0, 0);
    DrawWall(38, 10, 2*castleW, 1, 0);
    DrawWall(38, 10, 2*castleW, 2, 0);

    var frontL = castleW - gateTowerW/2;
    DrawWall(38, 10, frontL, -1, castleW - frontL/2);
    DrawWall(38, 10, frontL, -1, -(castleW - frontL/2));
    DrawGateTower(gateTowerW, gateTowerH);

    if (animateFlag) {
        if (gateMov < 0 || gateMov > 210) {
            gateDir *= -1;
            gateMov += gateDir;
            animateFlag = !animateFlag;
        }
        else { gateMov += gateDir; }
    }
    DrawPortcullis(gateTowerW/2, gateTowerH/2);

    requestAnimFrame(render);
}

function DrawGround()
{
    lightAmbient = vec4(0.4, 0.4, 0.4, 1);
    lightDiffuse = vec4(0.2, 0.2, 0.2, 1);
    lightSpecular = vec4(0.2, 0.2, 0.2, 1);
    materialAmbient = vec4(0, 1, 0, 1);
    materialDiffuse = vec4(0, 1, 0, 1);
    materialSpecular = vec4(0, 1, 0, 1);
    materialShininess = 6;
    SetupLightingMaterial();

    modelViewStack.push(modelViewMatrix);
    var s = scale4(10*castleW, 0.1, 10*castleW);
    var t = translate(0, -0.05, 0);
    modelViewMatrix = mult(mult(modelViewMatrix, t), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function DrawTower(d, h, x, z)
{
    lightAmbient = vec4(0.1, 0.1, 0.1, 1);
    lightDiffuse = vec4(0.4, 0.4, 0.4, 1);
    lightSpecular = vec4(0.2, 0.2, 0.2, 1);
    materialAmbient = vec4(0.2, 0.2, 0.2, 1);
    materialDiffuse = vec4(0.4, 0.4, 0.4, 1);
    materialSpecular = vec4(1, 1, 1, 1);
    materialShininess = 9;
    SetupLightingMaterial();

    modelViewStack.push(modelViewMatrix);
    var s = scale4(2*d, h, 2*d);
    var t = translate(x, h/2, z);
    modelViewMatrix = mult(mult(modelViewMatrix, t), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();

    gl.drawArrays(gl.TRIANGLES, 36, 2400);
}

function DrawWall(h, w, l, turns, z)
{
    lightAmbient = vec4(0.1, 0.1, 0.1, 1);
    lightDiffuse = vec4(0.4, 0.4, 0.4, 1);
    lightSpecular = vec4(0.2, 0.2, 0.2, 1);
    materialAmbient = vec4(0.2, 0.2, 0.2, 1);
    materialDiffuse = vec4(0.4, 0.4, 0.4, 1);
    materialSpecular = vec4(1, 1, 1, 1);
    materialShininess = 9;
    SetupLightingMaterial();

    modelViewStack.push(modelViewMatrix);
    var s = scale4(w, h, l);
    var r = rotate(turns * 90, 0, 1, 0);
    var t = translate(castleW, h/2, z);
    modelViewMatrix = mult(mult(mult(modelViewMatrix, r), t), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    var parapetH = 5;
    var parapetLowH = 3;
    var parapetW = 1;
    var parapetL = 10;
    var parapetGapL = 4;
    for (var i = 0; i < l/parapetL; i++)
    {
        modelViewStack.push(modelViewMatrix);
        s = scale4(parapetW, parapetH, parapetL - parapetGapL);
        t = translate(castleW + w/2 - parapetW/2, h + parapetH/2,
            z - l/2 + (parapetL - parapetGapL)/2 + i*parapetL);
        modelViewMatrix = mult(mult(mult(modelViewMatrix, r), t), s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        modelViewMatrix = modelViewStack.pop();
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        modelViewStack.push(modelViewMatrix);
        s = scale4(parapetW, parapetLowH, parapetGapL);
        t = translate(castleW + w/2 - parapetW/2, h + parapetLowH/2,
            z - l/2 + parapetL - parapetGapL/2 + i*parapetL);
        modelViewMatrix = mult(mult(mult(modelViewMatrix, r), t), s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        modelViewMatrix = modelViewStack.pop();
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}

function DrawGateTower(w, h)
{
    lightAmbient = vec4(0.4, 0.4, 0.4, 1);
    lightDiffuse = vec4(1, 1, 1, 1);
    lightSpecular = vec4(1, 1, 1, 1);
    materialAmbient = vec4(0, 0, 0.3, 1);
    materialDiffuse = vec4(0, 0, 0.3, 1);
    materialSpecular = vec4(0.5, 0.5, 0.5, 1);
    materialShininess = 50;
    SetupLightingMaterial();

    modelViewStack.push(modelViewMatrix);
    var s = scale4(w, h, w);
    var t1 = translate(0, h/2, castleW);
    modelViewMatrix = mult(mult(modelViewMatrix, t1), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();
    gl.drawArrays(gl.TRIANGLES, 2436, 462);

    modelViewStack.push(modelViewMatrix);
    var r = rotate(180, 0, 1, 0);
    modelViewMatrix = mult(mult(mult(modelViewMatrix, t1), r), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();
    gl.drawArrays(gl.TRIANGLES, 2748, 150);

    modelViewStack.push(modelViewMatrix);
    s = scale4(1.1 * w, 0.1 * h, 1.1 * w);
    t1 = translate(0, 1.05*h, castleW);
    modelViewMatrix = mult(mult(modelViewMatrix, t1), s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelViewMatrix = modelViewStack.pop();
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    var t2;
    for (var i = 0; i < 4; i++)
    {
        r = rotate(i * 90, 0, 1, 0);
        for (var j = 0; j <5; j++)
        {
            modelViewStack.push(modelViewMatrix);
            s = scale4(w/10 , h/10, w/10);
            t1 = translate(w/2, 0, -w/2 + j * w/5);
            t2 = translate(0, 1.15 * h, castleW);
            modelViewMatrix = mult(mult(mult(mult(modelViewMatrix, t2), r), t1), s);
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            modelViewMatrix = modelViewStack.pop();
            gl.drawArrays(gl.TRIANGLES, 0, 36);

            modelViewStack.push(modelViewMatrix);
            s = scale4(w/10, h/20, w/10);
            t1 = translate(w/2, 0, -0.4 * w + j * w/5);
            t2 = translate(0, 1.125 * h, castleW);
            modelViewMatrix = mult(mult(mult(mult(modelViewMatrix, t2), r), t1), s);
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            modelViewMatrix = modelViewStack.pop();
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
    }
}

function DrawPortcullis(w, h)
{
    lightAmbient = vec4(0.1, 0.1, 0.1, 1);
    lightDiffuse = vec4(0.4, 0.4, 0.4, 1);
    lightSpecular = vec4(0.2, 0.2, 0.2, 1);
    materialAmbient = vec4(0.2, 0.2, 0.2, 1);
    materialDiffuse = vec4(0.4, 0.4, 0.4, 1);
    materialSpecular = vec4(1, 1, 1, 1);
    materialShininess = 9;
    SetupLightingMaterial();

    var s = scale4(w/30, h, w/60);
    for (var i = 1; i < 10; i++)
    {
        modelViewStack.push(modelViewMatrix);
        var t = translate(-w/2 + i * w/10, h/2 + gateMov*gateStep, castleW);
        modelViewMatrix = mult(mult(modelViewMatrix, t), s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        modelViewMatrix = modelViewStack.pop();
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    s = scale4(w, w/30, w/60);
    for (i = 1; i < 12; i++)
    {
        modelViewStack.push(modelViewMatrix);
        t = translate(0, i * h/12 + gateMov*gateStep, castleW);
        modelViewMatrix = mult(mult(modelViewMatrix, t), s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        modelViewMatrix = modelViewStack.pop();
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}

function scale4(a, b, c)
{
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

function multiply(m, v)
{
    return vec4(
        m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2] + m[0][3]*v[3],
        m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2] + m[1][3]*v[3],
        m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2] + m[2][3]*v[3],
        m[3][0]*v[0] + m[3][1]*v[1] + m[3][2]*v[2] + m[3][3]*v[3]
    );
}