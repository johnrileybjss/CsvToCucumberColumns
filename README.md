# CSV To Cucumber Columns

# Description
This is a simple utility written in Node.js which converts a CSV file to Cucumber Columnar format

# Usage
## Basic Usage
`node src/js/convert.js -i /relative/path/to/input-file.csv`
## Specify Output File
`node src/js/convert.js -i /relative/path/to/input-file.csv -o /relative/path/to/output-file.txt`
## Specify Padding
`node src/js/convert.js -i /relative/path/to/input-file.csv -p 4`

# Arguments

* -i = Relative path of the input file to be read (required).
* -o = Relative path of the output file to be written to (optional, default is output/test.txt).
* -p = Number of spaces to pad the end of each string field with (optional, default is 3).