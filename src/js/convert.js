'use strict';

(function(){
    var _ = require('underscore');
    var fs = require('fs');
    var csv = require('csvtojson');

    var STR_NULL = 'NULL';
    var STR_DIV = '\n---------------------------------\n';

    var EXT_CSV = 'csv';
    var EXT_XLS = 'xls';
    var EXT_XLSX = 'xlsx';

    var ARG_INPUT = "-i";
    var ARG_OUTPUT = "-o";
    var ARG_PADDING = "-p";
    var ARG_VERBOSE = "-v";

    var DEFAULT_PADDING = 3;
    var DEFAULT_OUTPUT_FILE = "tmp/test.txt";

    // Loads the Polyfill for the String.prototype.padEnd function
    loadPadEnd();

    // Validate the Number of Arguments
    if(!validateArgs()){
        return;
    }

    // Loads the Arguments and Validates that there is an Input File argument
    var args = loadArgsObject();
    if(!args.inputFile){
        console.log("Error: No input file provided. Please provide an input file by using the -i flag and specifying the relative path of the file you'd like to use.");
        return;
    }

    // Validates the Extension of the Input File
    var inputExtension = args.inputFile.split('.').pop();
    if(!validateExtension(inputExtension)){
        return;
    }

    // Validates that the Input File Exists
    if(!fs.existsSync(args.inputFile)) {
        console.log('Error: Input file does not exist: ' + args.inputFile);
        return;
    }

    console.log("Attempting to parse file for csv data: " + args.inputFile);

    var headerRow;
    var rows = [];
    csv().fromFile(args.inputFile)
    .on('header', function(header){
        if(header){
            headerRow = header;
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

        if(args.isVerbose){
            _.each(rows, function(row){
                console.log(row);
            });
            console.log(STR_DIV);
        }

        console.log('Computing Minimum Field Lengths for CSV Columns...');
        var sizeMap = computeSizeMap(headerRow, rows, args.padding);

        if(args.isVerbose){
            console.log(sizeMap);
            console.log(STR_DIV);
        }

        console.log('Generating Padded Strings...');

        var paddedOutput = applyPaddedFieldLengths(headerRow, rows, sizeMap);

        if(args.isVerbose){
            _.each(paddedOutput, function(item){
                console.log(item);
            });
            console.log(STR_DIV);
        }

        console.log('Generating Cucumber Columns from Padded Strings...');
        var cucumberArray = generateCucumberArray(headerRow, paddedOutput);

        console.log('Cucumber Columns Generated.');

        if(args.isVerbose){
            _.each(cucumberArray, function(row){
                console.log(row);
            });
            console.log(STR_DIV);
        }

        console.log('Writing to output file: ' + args.outputFile);

        var file = fs.createWriteStream(args.outputFile);
        file.on('error', function(err){
            console.log(err);
        });

        _.each(cucumberArray, function(row){
            file.write(row + '\n');
        });

        file.end();

        console.log('File Written. End of program.');
    });

    function validateArgs(){
        if(process.argv.length < 3){
            console.log("No arguments provided. Please provide the relative path of the file you would like to convert.");
            return false;
        }

        return true;
    }

    function validateExtension(inputExtension){
        if(!inputExtension){
            console.log('Error: The input file provided is not a CSV file. Please provide a file with the .csv extension.');
            return false;
        }
        else if(inputExtension === EXT_XLS || inputExtension === EXT_XLSX){
            console.log('Error: This script has detected that the input file provided is a Microsoft Excel file. '
                + 'This file is not directly compatible with this script. Please convert your file to a CSV file and '
                + 'use the exported CSV as your new input file.');
            return false;
        }
        else if(inputExtension !== EXT_CSV){
            console.log('Error: The input file provided is not a CSV file. Please provide a file with the .csv extension.');
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
                case ARG_VERBOSE:
                    output.isVerbose = true;
                    i--;
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
                if(row[key] === STR_NULL){
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

