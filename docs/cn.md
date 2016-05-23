# Mobx-Roof

Mobx-Roof是基于[mobx](https://github.com/mobxjs/mobx)的简单React MVVM框架, 目标是通过更ORM化的思维来管理数据, 如通过`继承`, `重载` 等面向对象方式来实现数据模型的扩展

下边完整的例子可以在项目`example`目录中找到

## 基础篇

先看下要实现的效果

![image](https://os.alipayobjects.com/rmsportal/ocoJUnwRTPpvoUv.gif)

### 1.创建模型

我们先通过`createModel`创建一个用户登录数据模型:

- `name`: 定义类名
- `data`: 返回的数据会被转换成mobx的`reactive data`, 这种数据在变化时候会自动触发监听函数
- `actions`: 定义模型的方法, 方法返回值会转换成`Promise`

```javascript
import { createModel } from 'mobx-roof';
import * as api from '../api';

export default createModel({
  name: 'User',
  data() {
    return {
      isLogin: false,
      password: null,
      username: null,
      userId: null,
      loginError: '',
      userInfo: {},
    };
  },
  actions: {
    async login(username, password) {
      const res = await api.login(username, password);
      if (res.success) {
        // 使用set可以设定多个值, 并只触发一次数据变动事件
        this.set({
          userId: res.id,
          username,
          password,
          isLogin: true,
          loginError: null,
        });
      } else {
        // 直接赋值会触发一次数据变动事件
        this.loginError = res.message;
      }
    },
  },
});

```

### 2.绑定到react组件

通过`@context`创建一个隔离的数据空间.

```javascript
import React, { Component, PropTypes } from 'react';
import { context } from 'mobx-roof';
import UserModel from './models/User';

@context({ user: UserModel })
export default class App extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  login() {
    this.props.user.login(this.refs.username.value, this.refs.password.value);
  }
  render() {
    const { user } = this.props;
    if (!user.isLogin) {
      return (
        <div className="container">
          <div>
            username:  <input ref="username" type="text" placeholder="Jack"/>
            password:  <input ref="password" type="password" placeholder="123"/>
            <button onClick={::this.login}>login</button>
            <span style={{color: 'red'}}>{user.loginError}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="container">
        Welcome! {user.username}
      </div>
    );
  }
}

```

### 3.获取action状态

通过`getActionState`可以获取任意的action执行状态, 状态里有`loading`和`error`两个字段, 当action开始执行时候状态`loading`为true, 而如果执行失败错误信息会存入`error`中.

```javascript
@context({ user: UserModel })
export default class App extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  login() {
    this.props.user.login(this.refs.username.value, this.refs.password.value);
  }
  render() {
    const { user } = this.props;
    const { loading: loginLoading, error: loginError } = user.getActionState('login');
    if (!user.isLogin) {
      return (
        <div className="container">
          <div>
            username:<input ref="username" type="text" placeholder="Jack"/>
            password:<input ref="password" type="password" placeholder="123"/>
            <button onClick={::this.login}>login</button>
            {loginLoading
              ? <span>loading...</span>
              : <span style={{ color: 'red' }}>{(loginError && loginError.message) || user.loginError}</span>
            }
          </div>
        </div>
      );
    }
    return (
      <div className="container">
        Welcome! {user.username}
      </div>
    );
  }
}
```
### 4.拆分react组件, 实现组件间数据共享

下边例子从App组件拆分出了`UserLogin`和`UserDetail`组件, 并通过`@observer` 来订阅父节点context中的数据.

```javascript
import React, { Component, PropTypes } from 'react';
import { context, observer } from 'mobx-roof';
import UserModel from './models/User';

@observer('user')
class UserLogin extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
  }
  login() {
    this.props.user.login(this.refs.username.value, this.refs.password.value);
  }
  render() {
    const { user } = this.props;
    const { loading: loginLoading, error: loginError } = user.getActionState('login');
    return (
      <div className="container">
        <div>
          username:<input ref="username" type="text" placeholder="Jack"/>
          password:<input ref="password" type="password" placeholder="123"/>
          <button onClick={::this.login}>login</button>
          {loginLoading
            ? <span>loading...</span>
            : <span style={{ color: 'red' }}>{(loginError && loginError.message) || user.loginError}</span>
          }
        </div>
      </div>
    );
  }
}

// 这里如果user字段从context获取的类型不是UserModel则会报错
@observer({ user: UserModel })
class UserDetail extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
  }
  logout() {
    this.props.user.logout();
  }
  render() {
    return (
      <div className="container">
        Welcome! {this.props.user.username}
        <button onClick={::this.logout}>logout</button>
      </div>
    );
  }
}

@context({ user: UserModel })
export default class App extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  render() {
    const { user } = this.props;
    if (!user.isLogin) {
      return <UserLogin />;
    }
    return <UserDetail />;
  }
}

```

### 5.autorun 实现数据自动保存

`autorun`可以在所依赖数据变动时候自动运行定义的函数, 下边例子当UserModel数据发生变化时候会自动保存到localStorage

```javascript
import { createModel } from '../../src';
import * as api from '../api';
const STORE_KEY = 'mobx-roof';

export default createModel({
  name: 'User',
  data() {
    // 从localStorage初始化数据
    let data = localStorage.getItem(STORE_KEY);
    data = data ? JSON.parse(data) : {};
    return {
      isLogin: false,
      password: null,
      username: null,
      userId: null,
      loginError: '',
      userInfo: {},
      ...data,
    };
  },
  actions: {
    async login(username, password) {
      const res = await api.login(username, password);
      if (res.success) {
        this.set({
          userId: res.id,
          isLogin: true,
          loginError: null,
          username,
          password,
        });
      } else {
        this.loginError = res.message;
      }
    },
    logout() {
      this.set({
        isLogin: false,
        username: null,
        password: null,
        userId: null,
      });
    },
  },
  autorun: {
    // 自动保存到localStorage, 这里通过`toJSON`会让该方法监听所有的数据变化
    saveToLocalStorage() {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.toJSON()));
    },
  },
});

```

## 高级篇

高级篇会开始多个model的数据共享

### 1.中间件

下边是一个简单的日志打印插件, `before` `after` `error` 分别对应action执行前, 执行后及执行错误, `filter` 可以对action进行过滤;

```javascript
// Before exec action
function preLogger({ type, payload }) {
  console.log(`${type} params: `, payload.join(', '));
  return payload;
}

// Action exec fail
function errorLogger({ type, payload }) {
  console.log(`${type} error: `, payload.message);
  return payload;
}

// After exec action
function afterLogger({ type, payload }) {
  console.log(`${type} result: `, payload);
  return payload;
}

export default {
  filter({ type }) {
    return /User/.test(type);
  },
  before: preLogger,
  after: afterLogger,
  error: errorLogger,
};

```
### 2.数据关联
### 3.数据模型的继承
### 4.数据模型的嵌套