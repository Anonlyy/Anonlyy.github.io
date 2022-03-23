// 比对差异,并记录起来
var patch = {
    'REPLACE' : 0, // 替换
    'REORDER' : 1, // 新增、删除、移动
    'PROPS' : 2, // 属性更改
    'TEXT' : 3 // 文本内容更改
}

// diff 函数,对比两棵DOM树
function diff (oldTree, newTree) {
  var index = 0 // 当前节点的标志
  var patches = {} // 用来记录每个节点差异的对象
  dfsWalk(oldTree, newTree, index, patches)
  return patches
}

// 对两棵树进行深度优先遍历
function dfsWalk (oldNode, newNode, index, patches) {
  var currentPatch = []

  // 新节点被删除
  if (newNode === null) {
   // 真正的DOM节点在执行重新排序时会被删除，所以在这里不需要做操作
  // 文本节点内容被更改
  } else if (_.isString(oldNode) && _.isString(newNode)) {
    if (newNode !== oldNode) {
      currentPatch.push({ type: patch.TEXT, content: newNode }) // 存入差异数组
    }
  // 节点标签一致,但属性不同或子节点不同 
  } else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
    // 不同的属性
    var propsPatches = diffProps(oldNode, newNode) // 返回属性列表
    if (propsPatches) {
      currentPatch.push({ type: patch.PROPS, props: propsPatches }) // 存入差异数组
    }
    // 子节点不同
    diffChildren(
        oldNode.children,
        newNode.children,
        index,
        patches,
        currentPatch
      )
  // 节点不一致,替换成新节点
  } else {
    currentPatch.push({ type: patch.REPLACE, node: newNode }) // 存入差异数组
  }

  if (currentPatch.length) {
    // 对比oldNode和newNode的不同，记录下来
    patches[index] = currentPatch
  }
}

// 遍历子节点
function diffChildren (oldChildren, newChildren, index, patches, currentPatch) {
  // 针对新增、移动、删除情况
  // 传入两个DOM树,并输出标记过的节点数组(标记了新节点的顺序、包括删除和新增)
  /**
   *  type：remove moves[0] = {index: index, type: 0}
   *  type：add、insert moves[0] = {index: index, item: item, type: 1}
   */
  var diffs = listDiff(oldChildren, newChildren, 'key')
  newChildren = diffs.children
  if (diffs.moves.length) {
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves }
    currentPatch.push(reorderPatch) // 存入差异数组
  }

  var leftNode = null
  var currentNodeIndex = index
  oldChildren.forEach(function (child, i) {
    var newChild = newChildren[i]
    currentNodeIndex = (leftNode && leftNode.count) // 计算节点的标识
      ? currentNodeIndex + leftNode.count + 1
      : currentNodeIndex + 1
    dfsWalk(child, newChild, currentNodeIndex, patches) // 深度遍历子节点
    leftNode = child
  })
}

// 对比 同个节点 不同的属性
function diffProps (oldNode, newNode) {
  var count = 0
  var oldProps = oldNode.props
  var newProps = newNode.props

  var key, value
  var propsPatches = {}

  // 对比不同的属性
  for (key in oldProps) {
    value = oldProps[key]
    if (newProps[key] !== value) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // 找到新属性
  for (key in newProps) {
    value = newProps[key]
    if (!oldProps.hasOwnProperty(key)) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // 如果所有属性一致
  if (count === 0) {
    return null
  }

  return propsPatches
}

function isIgnoreChildren (node) {
  return (node.props && node.props.hasOwnProperty('ignore'))
}

module.exports = diff