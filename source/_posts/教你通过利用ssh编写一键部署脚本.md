---
title: 教你通过利用ssh编写前端一键部署脚本
date: 2020-05-19 19:21:17
tags: 开发技巧
categories: 开发技巧
cover: https://image.xposean.top/blogImage/003.png

---

今天来介绍一下, 如何利用`node`编写部署脚本, 来实现一键部署的功能

## 背景

因为我司的开发流程比较特殊, 开发环境的服务器`ip`会经常变化, 并不固定, 所以在前端部署代码的时候十分麻烦,

部署流程如下:

 ![image-20200623172139353](https://image.xposean.top/20200623172147.png)

可以看出, 这种方式存在一些缺点：

- 每次部署都需要打开`xshell`或`winSCP`软件
- 部署多个服务器`ip`,十分麻烦, 需要来回切换, 容易替换错误
- 每次都需要手动复制代码或执行上传命令

全自动化的部署其实首推`jenkins`实现，`jenkins`可以根据`gitlab push`或者`merge`事件自动打包代码到`web`目录，可以参考：

[实战笔记：Jenkins打造强大的前端自动化工作流](https://juejin.im/post/5ad1980e6fb9a028c42ea1be)

但是因为我们的部署流程比较特殊, 并不是固定的几台服务器, 没有那么方便, 其次公司的`gitlab`最高权限是在总部, 操作起来比较麻烦, 需要申请权限, 于是为了能够快速的完成一键部署功能, 选用了采用轻量部署的方案来实现自动化部署了.

## 方案预研

我们想要达到的效果是: 运行 `npm run deploy` 的命令, 再输入部署的服务器ip, 就直接将执行打包部署等一系列操作。

那么要达到这个效果, 首先就要使用到一些`node` 库了,

### 1. node-ssh

首先要知道的是, 我们想要通过本地连接到我们对应的服务器, 那么就要使用`ssh`协议连接服务器。

[node-ssh](https://github.com/steelbrain/node-ssh)是一个基于ssh2的轻量级npm包，主要用于ssh连接服务器、上传文件、执行命令, 通过它我们可以替代`xshell`的功能

用到的api：

- `ssh.connect`：连接服务器

```bash
ssh.connect({
  host: 'localhost',
  username: 'steel',
  privateKey: '/home/steel/.ssh/id_rsa'
})
```

- `ssh.putFile`：上传文件

```javascript
 ssh.putFile('/home/steel/Lab/localPath', '/home/steel/Lab/remotePath').then(function() {
    console.log("The File thing is done")
  }, function(error) {
    console.log("Something's wrong")
    console.log(error)
  })
```

- `ssh.execCommand`：执行远端服务器命令

```javascript
 ssh.execCommand('rm -r dist', { cwd:'/var/www' }).then(function(result) {
    console.log('STDOUT: ' + result.stdout)
    console.log('STDERR: ' + result.stderr)
  })
```

### 2. archiver

[archiver](https://github.com/archiverjs/node-archiver)是一个用于生成压缩包的`npm`包，可以把我们编译后的文件夹打包成`zip`、`gz`等格式的压缩包, 方便上传到服务端

使用指南：

```javascript
  const archiver = require('archiver');

  // 设置压缩类型及级别
  const archive = archiver('zip', {
    zlib: { level: 9 },
  }).on('error', err => {
    throw err;
  });
  
  // 创建文件输出流
  const output = fs.createWriteStream(__dirname + '/dist.zip');
  
  // 通过管道方法将输出流存档到文件
  archive.pipe(output);
  
  // 从subdir子目录追加内容并重命名
  archive.directory('subdir/', 'new-subdir');
  
  // 完成打包归档
  archive.finalize();
```

### 3. chalk

[chalk](https://github.com/chalk/chalk) 就是用来在终端中优雅地输出带颜色的文本, **不需要记忆、查阅样式手册**,直接调用chalk的函数可以很方便的显示不同颜色不同样式的终端文字, 效果大致如下：

![](https://image.xposean.top/20200813113745.png)

`chalk` 将各种颜色和样式修饰符实现为各个函数，并且支持链式调用。

```javascript
const chalk = require('chalk');

// 输出蓝色的MCC
console.log(chalk.blue('MCC'));

// 输出蓝色带下划线的MCC
console.log(chalk.blue.underline('MCC'));

// 使用RGB颜色输出
console.log(chalk.rgb(4, 156, 219).underline('MCC'));
console.log(chalk.hex('#049CDB').bold('MCC'));
console.log(chalk.bgHex('#049CDB').bold('MCC'));
```



### 4. inquirer

因为我们的命令行使用过程中需要 用户输入或者选择一些参数, 那么就可以使用[inquirer](https://github.com/SBoudrias/Inquirer.js)来处理用户的终端输入, 实现终端交互。很多`cli`脚手架都是使用`inquirer`来实现配置的哦。

```javascript
const promptList = [{
    type: 'input',
    name: 'IP',
    message: 'please input hostIP(example: 10.30.1.1)?',
    default: '10.30.10.62',
    validate: async (input) => {
        if (input === '') {
            return 'IP is require!!(ctrl+c exit)'
        }
        return true
    }
}];
```

就可以实现以下的效果：

![image-20200813111125706](http://image.xposean.top/20200813111131.png)



### 5. ora

如果想要在命令行中添加比较好看的`loading`, 这个时候[ora](https://github.com/sindresorhus/ora#readme)就可以派上用场了, 在一些需要网络通信场合, 加上`loading`可以拥有更好的用户体验, 所有这里我们还是给它加上。

```javascript
const ora = require('ora');
 
const spinner = ora('Loading unicorns').start();
 
setTimeout(() => {
    spinner.color = 'yellow';
    spinner.text = 'Loading rainbows';
}, 1000);
```

![img](https://image.xposean.top/20200813113629.svg)

那么以上就是我们在开发部署功能中会使用到的库了.



## 方案实践

那么在实际开发阶段, 我们共大致有这几个流程:

![image-20200813150838192](https://image.xposean.top/20200813150840.png)

流程如下：

  1. 提示用户输入 服务器`IP`、用户名(root)、密码(如果服务器`IP`是固定的, 可以统一写在配置文件里)
  2. 通过`node-ssh`测试连接服务器是否正常(固定服务器可不测试)
  3. 本地执行打包命令例：`npm run build`生成`dist`文件夹
  4. 通过`archiver`将`dist`文件夹打包成`dist.tar.gz`(`linux`系统可以直接解压此格式, 无需另外安装其他库)
  5. 连接服务器并上传压缩包，使用`ssh.putFile`上传`dist.tar.gz`
  6. 服务端解压缩`dist.tar.gz`，并重启`nginx`服务
  7. 删除本地`dist.tar.gz`文件



### 具体代码

通过`npm`下载对应的库

```shell
npm install node-ssh ora chalk inquirer shelljs archiver --save-dev
```



```javascript
//deploy.js 代码已注释
const Node_ssh = require('node-ssh')
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')
const inquirer = require('inquirer')
const shell = require('shelljs')
const projectDir = process.cwd()
const ssh = new Node_ssh()
const fs = require('fs')
const archiver = require('archiver')

const resolve = dir => {
  return path.join(__dirname, dir)
}
// loggs
const errorLog = error => console.log(chalk.red(`*********${error}*********`))
const defaultLog = log => console.log(chalk.blue(`*********${log}*********`))
const successLog = log => console.log(chalk.green(`*********${log}*********`))
// 编译模式(纯编译、打包为压缩包、打包并上传)
let deployMode = 'deploy'
// 文件夹位置
const distDir = path.resolve(__dirname, '../dist')
const distZipPath = path.resolve(__dirname, '../dist.tar.gz')
const host = ''
let ipFileContent = ''
const sshConfig = {
  host,
  username: 'root', // 默认用户名
  port: 22 // SSH端口
}

// ********* TODO 打包代码 *********
const compileDist = async () => {
  // 进入本地文件夹
  defaultLog('开始编译打包代码')
  shell.cd(path.resolve(__dirname, '../'))
  shell.exec(`npm run build`)
  successLog('编译完成')
}
const runTask = async (isRepeat) => {
  if (isRepeat) {

  }
  defaultLog('进入前端代码打包自动替换模式')
  // 判断是否存在 dist 文件夹有则询问是否重新编译
  const modePromptList = [
    {
      type: 'list',
      name: 'mode',
      choices: [
        {
          name: 'Packed into packages(.tar.gz)',
          value: 'gzip',
          short: 'gzip'
        },
        {
          name: 'Packed into dist folder',
          value: 'build',
          short: 'build'
        },
        {
          name: 'Auto deploy',
          value: 'deploy',
          short: 'deploy'
        }
      ],
      message: 'Please choice your mode?',
      default: 'deploy'
    }
  ]
  const modePromptValue = await inquirer.prompt(modePromptList)
  deployMode = modePromptValue.mode
  let deployPromptList = []
  if (deployMode === 'deploy') {
    deployPromptList = [
      {
        type: 'input',
        name: 'IP',
        message: 'please input hostIP(example: 10.30.1.1)?',
        default: '10.30.10.62',
        validate: async (input) => {
          if (input === '') {
            return 'IP is require!!(ctrl+c exit)'
          }
          return true
        }
      },
      {
        type: 'input',
        name: 'username',
        message: 'please input username(example: root)?',
        default: 'root'
      },
      {
        type: 'Password',
        name: 'password',
        message: 'please input password(example: root)?',
        default: 'root'
      }
    ]
  }
  if (deployMode !== 'build' && fs.existsSync(distDir)) {
    deployPromptList.push({
      type: 'confirm',
      name: 'isRebuild',
      message: 'Do you need to rebuild dist folder?',
      default: false
    })
  }
  const promptValueList = await inquirer.prompt(deployPromptList)
  if (deployMode === 'gzip') {
    const isRebuild = promptValueList.isRebuild
    if (isRebuild || !fs.existsSync(distDir)) { // 重新编译本地代码
      await compileDist()
      startZip(sshConfig)
    } else { // 直接压缩上传代码
      startZip(sshConfig)
    }
    return
  } else if (deployMode === 'build') {
    await compileDist()
    return
  }
  let sshConnectState
  sshConfig.host = promptValueList.IP
  sshConfig.username = promptValueList.username
  sshConfig.password = promptValueList.password
  const spinner = ora({ text: `正在连接 ${sshConfig.host} \n`,
    spinner: {
      interval: 80, // Optional
      frames: ['⠋',
        '⠙',
        '⠹',
        '⠸',
        '⠼',
        '⠴',
        '⠦',
        '⠧',
        '⠇',
        '⠏'
      ]
    }
  })
  spinner.start()
  try {
    sshConnectState = await checkSSHConnect(sshConfig)
  } catch (err) {
    spinner.stop()
    if (err === 'client-authentication') { // 验证错误, 则重新输入密码
      sshConnectState = await handleAuthError(sshConfig, spinner)
    } else {
      errorLog('ssh 连接异常！请输入正确的IP地址、用户名或密码', err)
      return
    }
  }
  if (sshConnectState === 'success') {
    successLog('ssh 连接成功')
    spinner.stop()
    const isRebuild = promptValueList.isRebuild
    ipFileContent = readApiFile()
    // console.log('ipFileContent', ipFileContent)
    if (isRebuild || !fs.existsSync(distDir)) { // 重新编译本地代码
      await compileDist()
      startZip(sshConfig)
    } else { // 直接压缩上传代码
      startZip(sshConfig)
    }
  } else {
    spinner.stop()
    errorLog('ssh 连接异常！请输入正确的IP地址、用户名或密码')
  }
}
async function handleAuthError (sshConfig, spinner) {
  /* eslint-disable-next-line */
  errorLog('ssh 连接错误！请输入正确的密码')
  const errorPromptList = [
    {
      type: 'Password',
      name: 'password',
      message: 'please input password(example: root)?',
      default: 'root'
    }
  ]
  const errorPromptValueList = await inquirer.prompt(errorPromptList)
  let sshConnectRepeatState = ''
  sshConfig.password = errorPromptValueList.password
  try {
    spinner = ora(`正在连接 ${sshConfig.host} \n`)
    spinner.start()
    sshConnectRepeatState = await checkSSHConnect(sshConfig)
    spinner.stop()
    return sshConnectRepeatState
  } catch (error) {
    spinner.stop()
    if (error === 'client-authentication') { // 验证错误, 则重新输入密码
      /* eslint-disable-next-line */
      return await handleAuthError(sshConfig, spinner)
    } else {
      return error
    }
  }
}
// 开始打包
async function startZip (config) {
  try {
    if (fs.existsSync(distZipPath)) {
      defaultLog('dist.zip已经存在, 即将删除压缩包')
      fs.unlinkSync(distZipPath)
    } else {
      defaultLog('即将开始压缩zip文件')
    }
    await compress('dist', path.basename('dist.tar.gz'))
    // await zipper.sync.zip(distDir).compress().save(distZipPath)
    successLog('文件夹压缩成功')
  } catch (error) {
    errorLog(error)
    errorLog('压缩dist文件夹失败')
    process.exit(0)
  }
  if (deployMode === 'deploy') {
    uploadFile(config)
  } else {
    successLog('执行完毕')
  }
}
// 测试是否联通ssh
const checkSSHConnect = async () => {
  return new Promise((resolve, reject) => {
    ssh.connect(sshConfig).then(() => {
      resolve('success')
    }).catch((err) => {
      // console.log('err', err.level)
      reject(err.level || 'unknown error')
    })
  })
}
// 上传文件
function uploadFile (config) {
  const spinner = ora(`正在连接 ${host}`)
  spinner.start()
  ssh.connect(sshConfig)
    .then(() => {
      spinner.stop()
      // successLog(`  SSH连接成功`)
      defaultLog(`上传zip至目录${sshConfig.webDir}`)
      ssh.putFile(`${projectDir}/dist.tar.gz`, `${sshConfig.webDir}/dist.tar.gz`)
        .then(() => {
          successLog(`  zip包上传成功`)
          defaultLog('解压zip包')
          statrRemoteShell(config)
        })
        .catch(err => {
          console.error('  文件传输异常', err)
          process.exit(0)
        })
    })
    .catch(err => {
      console.error(' 连接失败', err)
      process.exit(0)
    })
}
// 执行Linux命令
function runCommand (command, webDir) {
  return new Promise((resolve, reject) => {
    defaultLog(`执行命令${command}`)
    // console.log('webDir', webDir)
    ssh.execCommand(command, { cwd: webDir })
      .then(result => {
        resolve()
        if (result.stdout) {
          // console.log(result.stdout)
        }
        if (result.stderr && result.stderr.indexOf('debconf: unable to initialize frontend: Dialog') > -1) {
          errorLog('执行出错, 正在重试...')
          runCommand(command, webDir)
        } else if (result.stderr) {
          console.error('执行命令出错', result.stderr)
          process.exit(1)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 开始执行远程命令
async function statrRemoteShell (config) {
  const { webDir } = config
  try {
    // await runCommand('apt-get install unzip --force-yes', webDir)
    await runCommand(`cd ${webDir}`, webDir)
    await runCommand('rm -r dist', webDir)
    // await runCommand(`mkdir dist`, webDir)
    // await runCommand(`cd dist`, webDir)
    // await runCommand(`unzip -o ${webDir}dist.zip `, `${webDir}dist`)
    // await runCommand(`rm -r dist.zip`, `${webDir}`)
    await runCommand(`tar -zxmf dist.tar.gz -C ${webDir}`, `${webDir}`)
    await runCommand(`rm -r dist.tar.gz`, `${webDir}`)
    await runCommand(`service nginx restart`, `${webDir}`)
    await runCommand(`service manager restart`, `${webDir}`)
    successLog('  解压成功')
    deleteLocalZip(config)
  } catch (e) {
    console.error('  文件解压失败', err)
    process.exit(0)
  }
}

// 删除本地dist.zip包
function deleteLocalZip (config) {
  const { projectName, name } = config
  fs.unlink(`${projectDir}/dist.tar.gz`, err => {
    if (err) {
      console.error('本地dist.zip删除失败', err)
    }
    successLog('本地dist.zip删除成功')
    backupApiFile()
  })
}
// 恢复被删除的devApiUrl 文件
function backupApiFile () {
  fs.writeFile(resolve('./devApiUrl.js'), ipFileContent, (err) => {
    if (err) {
      errorLog('IP文件恢复失败', err)
    } else {
      successLog('IP文件恢复完成')
      successLog(` 恭喜您，项目部署成功了^_^`)
      process.exit(0)
    }
  })
}
function readApiFile () {
  return fs.readFileSync(resolve('./devApiUrl.js'), 'utf-8', (err, data) => {
    if (err) {
      errorLog('读取devApiUrl.js文件出错', err)
    } else {
      return data
    }
  })
}
// 压缩
function compress (sourceDir, targetPath) {
  const output = fs.createWriteStream(targetPath)
  const archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 5
    }
  })
  archive.pipe(output)
  archive.directory(sourceDir, path.basename(sourceDir))
  return archive.finalize()
}
runTask()

```

上面的代码即是整个自动部署的全部代码了, 那么可以在 `package.json`中新增命令,类似以下这样.

![image-20200813154820890](https://image.xposean.top/20200813154823.png)

那么就可以很方便的使用 `npm run deploy`去执行我们的自动部署功能啦。







## 优化方向

后续可以考虑加入脚手架中, 并上传至私有的`npm`库, 这样在操作多个项目的时候, 需要重复复制部署代码, 直接通过`npm instal xxx` 执行。

如果有更好的方案或者在文章中有错误的地方, 可以直接通过[github](https://github.com/Anonlyy)联系我哦, 不胜感激