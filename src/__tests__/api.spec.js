import { createModel, extendModel } from '../index';
import { expect } from 'chai';
import { autorun, isObservable } from 'mobx';
const use = () => {};
describe('mobx-roof', () => {
  const User = createModel({
    name: 'User',
    data: {
      name: 'initName',
      info: {
        address: 'beijing',
        habits: [],
      },
      friends: [],
    },
    actions: {
      changeName(name) {
        this.name = name;
      },
    },
  });
  it('api.createModel', async () => {
    const user = new User;
    expect(isObservable(user.info)).to.eql(true);
    expect(isObservable(user.info.habits)).to.eql(true);
    expect(user.name).to.eql('initName');
    let cache;
    let times = 0;
    autorun(() => {
      times ++;
      cache = user.friends.join('') + ' and ' + user.name + ' are in ' + user.info.address;
    });
    await user.changeName('me');
    user.friends.push('Jack');
    expect(times).to.eql(3);
    user.info.address = 'NanJing';
    expect(times).to.eql(4);
    expect(cache).to.eql('Jack and me are in NanJing');
  });
  it('api.createModel with action defined', () => {
    const User = createModel({
      name: 'User',
      data: {
        login: true,
      },
      actions: {
        login() {
        },
      },
    });
    expect(() => new User).to.throw(/is defined in action/);
  });
  it('api.extendModel', () => {
    const ChineseUser = extendModel(User, {
      data: {
        chinese: {
          zodiac: 'dragon',
        },
      },
    });
    expect(ChineseUser.uuid).to.not.eql(User.uuid);
    const user = new ChineseUser;
    let times = 0;
    autorun(() => {
      times ++;
      use(user.chinese.zodiac);
    });
    user.chinese.zodiac = 'snake';
    expect(times).to.eql(2);
  });
});