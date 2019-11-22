cd ~/Documents/Other/VlogCatalog/
FOLDERCOUNT=$(ls -l | grep -c ^d)
NEWFOLDERNUM=$((FOLDERCOUNT+1))
NEWFOLDERNAME="VLOG_00${NEWFOLDERNUM}"
mkdir ${NEWFOLDERNAME}
cd ${NEWFOLDERNAME}
youtube-dl $1
open .
