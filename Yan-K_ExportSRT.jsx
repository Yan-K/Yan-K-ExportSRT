(function(thisObj) {
    // Basic Script Info
    var scriptName = "Yan-K ExportSRT";

    // --- Main UI Building Function ---
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {
            resizeable: true
        });

        // UI Layout
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // Group: Options
        var optionsPanel = win.add("panel", undefined, "Source Options");
        optionsPanel.orientation = "column";
        optionsPanel.alignChildren = ["left", "top"];
        optionsPanel.margins = 15;

        var radioName = optionsPanel.add("radiobutton", undefined, "Use Layer Name");
        var radioSource = optionsPanel.add("radiobutton", undefined, "Use Source Text (Text Layers)");
        radioName.value = true; // Default

        // Group: Buttons
        var btnGroup = win.add("group");
        btnGroup.orientation = "column";
        btnGroup.alignChildren = ["fill", "top"];
        
        var btnExport = btnGroup.add("button", undefined, "Export Selected Layers");
        
        // Help / Status Text
        var statusText = win.add("statictext", undefined, "Select layers and click Export.");
        statusText.properties = {multiline: true};
        statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5], 1);


        // --- Button Logic ---
        btnExport.onClick = function() {
            var comp = app.project.activeItem;

            // Validation
            if (!comp || !(comp instanceof CompItem)) {
                alert("Please select a composition first.");
                return;
            }

            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length === 0) {
                alert("Please select at least one layer to export.");
                return;
            }

            // Determine Mode
            var useSourceText = radioSource.value;

            // Run Export
            exportSRT(selectedLayers, useSourceText);
        };

        // --- Core Export Logic ---
        function exportSRT(selectedLayers, useSourceText) {
            // Sort layers by time
            var layersArray = [];
            for (var i = 0; i < selectedLayers.length; i++) {
                layersArray.push(selectedLayers[i]);
            }

            layersArray.sort(function(a, b) {
                return a.inPoint - b.inPoint;
            });

            // Prompt Save
            var file = File.saveDialog("Save .srt file", "SubRip Files:*.srt");
            if (!file) return;

            if (!file.open("w")) {
                alert("Could not open file for writing.");
                return;
            }

            file.encoding = "UTF-8";

            try {
                for (var i = 0; i < layersArray.length; i++) {
                    var layer = layersArray[i];
                    var index = i + 1;

                    var startTime = layer.inPoint;
                    var endTime = layer.outPoint;
                    var timeCode = formatSRTTime(startTime) + " --> " + formatSRTTime(endTime);

                    var content = "";

                    if (useSourceText) {
                        if (layer.property("Source Text") != null) {
                            var textProp = layer.property("Source Text").value;
                            content = textProp.text;
                            content = content.replace(/\r/g, "\n");
                        } else {
                            content = layer.name;
                        }
                    } else {
                        content = layer.name;
                    }

                    file.writeln(index);
                    file.writeln(timeCode);
                    file.writeln(content);
                    file.writeln("");
                }
                
                statusText.text = "Saved: " + file.name;
                alert("SRT Export Successful!");

            } catch (error) {
                alert("Error: " + error.toString());
            } finally {
                file.close();
            }
        }

        // --- Helper: Timecode Formatter ---
        function formatSRTTime(seconds) {
            var totalSeconds = Math.floor(seconds);
            var milliseconds = Math.round((seconds - totalSeconds) * 1000);

            var hrs = Math.floor(totalSeconds / 3600);
            var mins = Math.floor((totalSeconds % 3600) / 60);
            var secs = totalSeconds % 60;

            return pad(hrs, 2) + ":" + pad(mins, 2) + ":" + pad(secs, 2) + "," + pad(milliseconds, 3);
        }

        function pad(number, length) {
            var str = "" + number;
            while (str.length < length) {
                str = "0" + str;
            }
            return str;
        }

        // Layout Resize Handling
        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };

        return win;
    }

    // --- Instantiate Script ---
    var myScriptPal = buildUI(thisObj);

    if ((myScriptPal != null) && (myScriptPal instanceof Window)) {
        myScriptPal.center();
        myScriptPal.show();
    }

})(this);
