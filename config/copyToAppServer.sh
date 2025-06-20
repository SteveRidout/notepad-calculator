scp notepadCalculator2.service steve@app-1:/lib/systemd/system/notepadcalculator2.service
scp notepadCalculator2-nginx.conf steve@app-1:/etc/nginx/sites-enabled/notepadcalculator2.conf

echo "Remember to restart nginx and notepadcalculator2 services on the server:"
echo ""
echo "ssh steve@app-1"
echo "sudo systemctl restart nginx"
echo "sudo systemctl restart notepadcalculator2"