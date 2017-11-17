#!/usr/bin/env node

const git = require("simple-git")();
var Promise = require("bluebird"),
	cli = require("commander"),
	mkdirp = require("mkdirp"),
	del = require("del"),
	fs = require("fs");

function copyFile(src, dest) {
	return new Promise((resolve, reject) => {
		CheckPath(dest.substring(0, dest.lastIndexOf("/")));
		let readStream = fs.createReadStream(src);
		readStream.once("error", err => reject(err));
		readStream.once("end", () => resolve(src));
		readStream.pipe(fs.createWriteStream(dest));	
	});
}

function CheckPath(path) {
	if (!fs.existsSync(path)) {
		mkdirp.sync(path)
	}
};

function collect(val, memo) {
	memo.push(val);
	return memo;
}

function asPath(v) {
	v = v.replace(/\\/g, "/");
	return v + (v.endsWith("/") ? "" : "/");
}

cli
	.version("1.0.0")
	.option("-C, --cmd <command>", "Add a command", collect, [])
	.option("-D, --deploy <path>", "Path to deploy", asPath, "Deploy/")
	.option("-c, --clean", "Clean deploy path")
	.option("-d, --dry", "No action, just list files")
	.parse(process.argv);

new Promise((resolve, reject) =>
	git.log(
		cli.cmd,
		(err, res) => (err ? reject(err) : resolve(res.all.reverse()))
	)
)
	.mapSeries(commit =>
		new Promise((resolve, reject) =>
			git.show(
				[commit.hash, "--oneline", "--name-status"],
				(err, res) => (err ? reject(err) : resolve(res))
			)
		).then(str => {
			let ligs = str.split("\n");
			ligs.shift();
			let rs = ligs.reduce((a, b) => {
				if (b == "") return a;
				let parts = b.split("\t");
				let action = parts[0] === "A" || parts[0] === "M" ? "A" : "S";
				a[action] = a[action] ? a[action].concat(parts[1]) : [parts[1]];
				return a;
			}, {});
			return rs;
		})
	)
	.then(actions => {
		let obj = {},
			res = [];
		actions.forEach(val => {
			if (val.A && val.A.length > 0) {
				val.A.forEach(file => {
					obj[file] = 1;
				});
			}
			if (val.S && val.S.length > 0) {
				val.S.forEach(file => {
					delete obj[file];
				});
			}
		});
		for (var file in obj) {
			if (obj.hasOwnProperty(file)) {
				res.push(file);
			}
		}
		return Promise.resolve(res.sort());
	})
	.then(res => {
		if (cli.dry) return Promise.resolve(res);
		if (cli.clean) del.sync([cli.deploy + '**']);
		return Promise.resolve(res).mapSeries(file => copyFile(file, cli.deploy + file));
	})
	.then(res => console.log(res))
	.catch(pb => console.log(pb));
