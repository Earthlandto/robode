#!/bin/sh

#Script to clean tex trash in this woorking folder (aux, bak, loc... files)

cd build

echo "Deleting..."

rm -v *.aux *.out *.log *.bbl *.blg *.lot *.toc *.lof *.loc *.synctex.gz

if test $# -ge 1 && test $1 == "-a" 
then
	cd ..
	rm -v *.tex.bak
fi 
	