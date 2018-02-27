'use strict';

(function(){


    var _ = require('underscore');
    var fs = require('fs');
    var csv = require('csvtojson');

    var NULL_STR = 'NULL';

    var ARG_INPUT = "-i";
    var ARG_OUTPUT = "-o";
    var ARG_PADDING = "-p";

    var DEFAULT_PADDING = 3;
    var DEFAULT_OUTPUT_FILE = "output/test.txt";

    loadPadEnd();

    if(!validateArgs()){
        return;
    }

    var args = loadArgsObject();

    console.log("Attempting to parse file: " + args.inputFile);

    var headerRow;
    var rows = [];
    csv().fromFile(args.inputFile)
    .on('header', function(header){
        if(header){
            headerRow = header;
            console.log('Found Header');
            console.log(header);
        }
    })
    .on('json', function(jsonObj){
        if(jsonObj){
            rows.push(jsonObj);
        }
    })
    .on('done', function(error){
        if(error){
            console.log(error);
        }

        console.log('Sanitizing Null Strings...');
        rows = sanitizeNullStrings(headerRow, rows);

        console.log('Computing Field Lengths for CSV Columns...');
        var sizeMap = computeSizeMap(headerRow, rows, args.padding);

        console.log('Finished computing field lengths.');
        console.log(sizeMap);

        console.log('Generating padded output...');

        var paddedOutput = applyPaddedFieldLengths(headerRow, rows, sizeMap);

        console.log('Padded Output Generated');
        console.log(paddedOutput);

        console.log('Generating Cucumber Columns from Padded Output...');
        var cucumberArray = generateCucumberArray(headerRow, paddedOutput);

        console.log('Cucumber Columns Generated. Writing to output file: ' + args.outputFile);

        var file = fs.createWriteStream(args.outputFile);
        file.on('error', function(err){
            console.log(err);
        });

        _.each(cucumberArray, function(row){
            file.write(row + '\n');
        });

        file.end();

        console.log('File Written.');
    });

    function validateArgs(){
        if(process.argv.length < 3){
            console.log("No arguments provided. Please provide the relative path of the file you would like to convert.");
            return false;
        }
        else if(process.argv.length % 2 !== 0){
            console.log('Invalid number of arguments provided.');
            return false;
        }

        return true;
    }

    function loadArgsObject(){
        var args = _.rest(process.argv, 2);
        var output = {};

        for(var i = 0; i < args.length; i += 2){
            switch(args[i]){
                case ARG_INPUT:
                    output.inputFile = args[i + 1];
                    break;
                case ARG_OUTPUT:
                    output.outputFile = args[i + 1];
                    break;
                case ARG_PADDING:
                    output.padding = args[i + 1];
                    break;
                default:
                    console.log('Invalid Argument Detected: ' + args[i]);
                    break;
            }
        }

        if(!output.outputFile){
            output.outputFile = DEFAULT_OUTPUT_FILE;
        }

        if(!output.padding){
            output.padding = DEFAULT_PADDING;
        }
        else {
            output.padding = parseInt(output.padding);
        }

        return output;
    }

    function loadPadEnd(){
        if (!String.prototype.padEnd) {
            String.prototype.padEnd = function padEnd(targetLength,padString) {
                targetLength = targetLength>>0; //floor if number or convert non-number to 0;
                padString = String((typeof padString !== 'undefined' ? padString : ' '));
                if (this.length > targetLength) {
                    return String(this);
                }
                else {
                    targetLength = targetLength-this.length;
                    if (targetLength > padString.length) {
                        padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
                    }
                    return String(this) + padString.slice(0,targetLength);
                }
            };
        }
    }

    function sanitizeNullStrings(headerRow, rows){
        var output = [];

        _.each(rows, function(row){
            _.each(headerRow, function(key){
                if(row[key] === NULL_STR){
                    row[key] = ' ';
                }
            });
            output.push(row);
        });

        return output;
    }

    function computeSizeMap(headerRow, rows, padding){
        var sizeMap = {};

        // Initialize Size Map
        _.each(headerRow, function(item){
            sizeMap[item] = item.length + padding;
        });

        // Compute Field Padded Lengths
        _.each(rows, function(row){
            _.each(headerRow, function(key){
                if(sizeMap[key] < row[key].length){
                    sizeMap[key] = row[key].length + padding;
                }
            });
        });

        return sizeMap;
    }

    function applyPaddedFieldLengths(headerRow, rows, sizeMap){
        var output = [];
        var outputHeader = {};

        // Apply Padded Field Lengths to Header
        _.each(headerRow, function(item){
            outputHeader[item] = item.padEnd(sizeMap[item], ' ');
        });

        output.push(outputHeader);

        // Apply Padded Field Lengths to Data
        _.each(rows, function(row){
            _.each(headerRow, function(key){
                row[key] = row[key].padEnd(sizeMap[key], ' ');
            });
            output.push(row);
        });

        return output;
    }

    function generateCucumberArray(headerRow, rows){
        var output = [];

        _.each(rows, function(row){
            output.push(generateCucumberRow(headerRow, row));
        });

        return output;
    }

    function generateCucumberRow(headerRow, jsonObj){
        var str = '|';
        _.each(headerRow, function(key){
            str += ' ' + jsonObj[key] + '|';
        });

        return str;
    }
})();

