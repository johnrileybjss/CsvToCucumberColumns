# CSV To Cucumber Columns

# Description
This is a simple utility written in Node.js which converts a CSV file to Cucumber Columnar format

# Usage
Note: On first time use, make sure to run `npm install` from the main directory of the project, in order to load the
required node modules.

## Basic Usage
`node src/js/convert.js -i /relative/path/to/input-file.csv`
## Specify Output File
`node src/js/convert.js -i /relative/path/to/input-file.csv -o /relative/path/to/output-file.txt`
## Specify Padding
`node src/js/convert.js -i /relative/path/to/input-file.csv -p 4`
## Specify Verbose mode
`node src/js/convert.js -i /relative/path/to/input-file.csv -v`

# Arguments

* -i = Relative path of the input file to be read (required).
* -o = Relative path of the output file to be written to (optional, default is output/test.txt).
* -p = Number of spaces to pad the end of each string field with (optional, default is 3).
* -v = Indicates to run the script in verbose mode. Displays more information about the script as it runs.

# Sample

## Sample Input
*test/input.csv*
```
column1,column2,column3
a,b,c
1,NULL,3
Test,This,Data
```

## Sample Command
`node src/js/convert.js -i test/input.csv -o tmp/test.txt -p 4`

## Sample Output
*tmp/test.txt*
```
| column1    | column2    | column3    |
| a          | b          | c          |
| 1          |            | 3          |
| Test       | This       | Data       |

```


