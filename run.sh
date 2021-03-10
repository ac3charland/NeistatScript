val=$(node node-app/index.js)
set -o allexport; source .env; set +o allexport;

cd ~/docs/Videos/VlogCatalog/
FOLDERCOUNT=$(ls -l | grep -c ^d)
NEWFOLDERNUM=$((FOLDERCOUNT+1))
NUMLENGTH=${#NEWFOLDERNUM}
NUMZEROS=$((3-${NUMLENGTH}))
ZEROS=$(printf '0%.0s' $(seq 1 $NUMZEROS))
NEWFOLDERNAME="VLOG_${NEWFOLDERNUM}"

if [ $NUMZEROS -gt 0 ]
then
    NEWFOLDERNAME="VLOG_${ZEROS}${NEWFOLDERNUM}"
fi

mkdir ${NEWFOLDERNAME}
cd ${NEWFOLDERNAME}
youtube-dl -f mp4 $val
open *.mp4
open ./
open -a Firefox "https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0"
