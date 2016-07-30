const recluster = require('recluster');

const cluster=recluster(process.argv[2]);
cluster.run();
process.on('SIGUSR2',function(){
	console.log(new Date().toISOString() + ' reloading cluster...');
	cluster.reload(); });

//IN GOD WE TRVST.
