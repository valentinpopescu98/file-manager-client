# demo-aws-client
React Front-End for [demo-aws](https://github.com/valentinpopescu98/demo-aws) Spring Boot Back-End

Demo for Amazon EC2, S3, RDS, Lambda.

This app is the client of the File Manager app. The app is supposed to allow the user to upload files into the S3 bucket and the files metadata to the RDS database. A Lambda Function is supposed to send an e-mail to the registered user when the upload is complete.

How to run:
1. scp -r -i ~/.ssh/filemanager-key.pem /path/to/demo-aws-client user@host:~/
2. ssh -i ~/.ssh/filemanager-key.pem user@host
3. chmod u+x ~/demo-aws-client/build-and-run.sh
4. ~/demo-aws-client/build-and-run.sh
