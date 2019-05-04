/* eslint-disable */

// Get mustache variables
var backgroundPath = "{{backgroundPath}}";
var iconsFolder = "{{iconsFolder}}";
var saveFolder = "{{saveFolder}}";
var iconSize = parseInt("{{iconSize}}", 10);
var color = "{{color}}";
var saveFlipped = "{{saveFlipped}}" === "true";
var onlyJPEG = "{{onlyJPEG}}" === "true";
var textData = eval('(function() { return {{{textData}}}; })()');

// Predefined constants
var jpegSize = 5000;
var docSize = 1000;

var hexes = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15
};

// Calculate color
var newColor;

if (color) {
    newColor = CreateColor(color);
}

// Create preset
var preset = new DocumentPreset();
preset.width = docSize;
preset.height = docSize;
preset.units = RulerUnits.Pixels;
preset.colorMode = DocumentColorSpace.RGB;

// Create document
var targetDoc = app.documents.addDocument("icon", preset);

// Add background
var background = targetDoc.groupItems.createFromFile(new File(backgroundPath));

// Adjust background size
var percentage =
    background.width >= background.height
        ? targetDoc.width / background.width
        : targetDoc.height / background.height;

background.width *= percentage;
background.height *= percentage;

background.top = targetDoc.height - ((targetDoc.height - background.height) / 2);
background.left = (targetDoc.width - background.width) / 2;

// Process all icons
var files = (new Folder(iconsFolder)).getFiles(checkFile);

writeProgress(0, files.length);

var preIndex = /^\d+-(?=(\w|\d)+)/g;
var extension = /\..+$/g;
var copyNumber = /(_|\()\d+(_|\))$/g;
var postIndex = /(-\d+)$/gi;
var nonLatinOrNumber = /[^a-zA-Z0-9]+/gi;
var multipleSpaces = /\s+/gi;
var bracketsAndWhitespaces = /(\(|\)|%20|\s)/g;
var trim = /(^\s+)|(\s+$)/g;

var outline;

for (var index in files) {

    if (checkMediator()) break;

    // Create icon object on artboard
    var file = files[index];
    var icon = targetDoc.groupItems.createFromFile(file);

    // Adjust it's coordinates and size
    var x = (targetDoc.width - iconSize) / 2,
        y = (targetDoc.height - iconSize) / 2,
        w = iconSize,
        h = iconSize;

    var gw = icon.width,
        gh = icon.height;

    percentage = gw >= gh ? w / gw : h / gh;

    icon.width *= percentage;
    icon.height *= percentage;

    icon.left = x + (w - icon.width) / 2;
    icon.top = targetDoc.height - (y + (h - icon.height) / 2);

    if (saveFlipped) {
        icon.resize(-100, 100);
    }

    // Give it a color
    if (newColor) setColor(icon, newColor);

    // Remove clipping masks
    clipScan(targetDoc);

    // Create file names
    var fileName = file.displayName
        .replace(extension, "")
        .replace(bracketsAndWhitespaces, "_");

    // Text
    if (textData) {
        var contents = file.displayName
            .replace(preIndex, "")
            .replace(extension, "")
            .replace(copyNumber, "")
            .replace(postIndex, "")
            .replace(nonLatinOrNumber, " ")
            .replace(multipleSpaces, " ")
            .replace(trim, "");

        var pointTextRef = targetDoc.textFrames.add();

        pointTextRef.contents = textData.upper
            ? contents.toUpperCase()
            : contents.toLowerCase()
            ;

        pointTextRef.textRange.characterAttributes.fillColor
            = CreateColor(textData.color);

        pointTextRef.textRange.characterAttributes.size = textData.size;

        var font = textFonts.getByName(textData.font);

        if (font) {
            pointTextRef.textRange.characterAttributes.textFont = font;
        }

        pointTextRef.selected = true;
        redraw();

        outline = pointTextRef.createOutline();

        outline.left = (targetDoc.width - outline.width) / 2;
        outline.top = icon.top -
            icon.height -
            (textData.offset * 1) +
            (outline.height / 2);
    }

    var epsName = pathJoin(saveFolder, fileName + ".eps");
    var jpegName = pathJoin(saveFolder, fileName + ".jpeg");

    if (!onlyJPEG) {
        // Save eps file
        var saveOptions = new EPSSaveOptions();
        saveOptions.preview = EPSPreview.TRANSPARENTCOLORTIFF;
        saveOptions.compatibility = Compatibility.ILLUSTRATOR10;
        saveOptions.embedAllFonts = true;
        saveOptions.cmykPostScript = true;
        saveOptions.embedLinkedFiles = true;

        targetDoc.saveAs(new File(epsName), saveOptions);
    }

    // Save jpeg file
    var exportOptions = new ExportOptionsJPEG();
    exportOptions.antiAliasing = false;
    exportOptions.optimization = true;
    exportOptions.qualitySetting = 100;
    exportOptions.horizontalScale = 500;
    exportOptions.verticalScale = 500;
    exportOptions.artBoardClipping = true;

    var jpegFile = new File(jpegName);

    targetDoc.exportFile(jpegFile, ExportType.JPEG, exportOptions);

    jpegFile.rename(jpegName);

    // Remove icon from artboard
    icon.remove();

    // Remove text from artboard
    if (outline) {
        outline.remove();
        outline = undefined;
    }

    // Report progress
    writeProgress(parseInt(index, 10) + 1 , files.length);
}

// Close document
targetDoc.close(SaveOptions.DONOTSAVECHANGES);

// Auxiliary functions
function clipScan(docRef) {
    for (i = docRef.pageItems.length - 1; i >= 0; i--) {
        if (docRef.pageItems[i].clipping == true) {
            docRef.pageItems[i].remove();
        }
    }
}

function checkFile(file) {
    return (file.name.match(/.*\.(svg|ai|eps)$/i) ? true : false);
}

function pathJoin() {
    return Array.prototype.slice.call(arguments).join("/");
}

function setColor(el, newColor) {
    switch (el.typename) {
        case "PathItem":
            if (el.filled) {
                el.fillColor = newColor;
            }
            break;
        case "CompoundPathItem":
            for (k = el.pathItems.length - 1; k > -1; k--) {
                if (el.pathItems[k].filled) {
                    el.pathItems[k].fillColor = newColor;
                }
            }
            break;
        case "GroupItem":
            var j;
            for (j = el.pageItems.length - 1; j > -1; j--) {
                setColor(el.pageItems[j], newColor);
            }
            break;
        case "PlacedItem":
            var j;
            for (j = el.pageItems.length - 1; j > -1; j--) {
                setColor(el.pageItems[j], newColor);
            }
            break;
        default:
            break;
    }
}

function writeProgress(current, max) {
    var file = new File("{{progressFile}}");
    if (file.open("w")) {
        file.write(current + "-" + max);
        file.close();
    }
}

function checkMediator() {
    var file = new File("{{mediatorFile}}");
    if (file.open("r")) {
        var content = file.read();
        return content.length > 0;
    }
    return false;
}

function CreateColor(hex) {
    hex = hex.substr(1, 6);
    var res = new RGBColor();
    res.red = hexes[hex[0]] * 16 + hexes[hex[1]];
    res.green = hexes[hex[2]] * 16 + hexes[hex[3]];
    res.blue = hexes[hex[4]] * 16 + hexes[hex[5]];
    return res;
}
