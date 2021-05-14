import Taro, { Component, Config } from '@tarojs/taro'
import Index from './pages/index'

import './app.scss'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      'page/mainPage/pages/entry/main',
      'page/mainPage/pages/allHouseList/main',
      'page/mainPage/pages/my/main',
      // 'page/mainPage/pages/signDesk/main',
      'page/mainPage/pages/projectList/main',
      // 'page/mainPage/pages/flagshipShop/main',
      // 'page/mainPage/pages/justHouseIndex/main',
      // 'page/mainPage/pages/auth/main',
      'page/mainPage/pages/blank/main',
      'page/mainPage/pages/blankTab/main',
      'page/mainPage/pages/blankTab2/main',
      'page/mainPage/pages/webview/main',
      'page/mainPage/pages/webview2/main',
      'page/mainPage/pages/webview_pure/main'
    ],
    subPackages: [
      {
        root: 'subpackages/pinTalkPage/',
        pages: ['pages/xsdjWebview/main', 'pages/videoViewingHouse/main']
      },
      {
        root: 'subpackages/other/',
        pages: [
          'introduceList/index',
          'shareRecord/index',
          'feedBack/index',
          'overviewPreview/index',
          'picturePage/index',
          'activity/index',
          'purchaseProcess/index',
          'expiredQrcode/index',
          'houseDetail/index',
          'houseAlbum/index',
          'typeList/index',
          'newsList/index',
          'brokerRule/index',
          'videoDetail/index',
          'pictureSave/index',
          'pictureSave/canvas',
          'pictureSave/canvas2c',
          'myAppointments/index',
          'poi/index',
          'eventsList/index',
          'appointmentForm/index',
          'recommend/index',
          'saleList/index',
          'publicCouponList/index',
          'articleList/index',
          'couponActivity/index',
          'couponReceive/index',
          'projectMap/index',
          'cardProjects/index',
          'bindUserInfo/index',
          'video/index',
          'bindUserMsg/index'
        ]
      },
      {
        root: 'subpackages/secondary/',
        pages: [
          'customerList/index',
          'signDesk/index',
          'cards/index',
          'actForm/index',
          'couponList/index',
          'activityList/index',
          'find/index',
          'card/index',
          'publishDynamic/index',
          'houseTypeDetail/index',
          'searchList/index',
          'areaList/index',
          'previewImage/index',
          'appointmentVerify/index',
          'setting/index',
          'authLogin/index',
          'bindCustomPhone/index',
          'project/index',
          'publicActivityList/index',
          'preview/index',
          'cityList/index',
          'findDetail/index',
          'bindPhone/index',
          'wxPay/index'
        ]
      },
      {
        root: 'subpackages/customerService/',
        pages: ['customerChat/index']
      },
      {
        root: 'subpackages/seller/',
        pages: [
          'messageProxy/index',
          'account/index',
          'accountSetting/index',
          'accountEducation/index',
          'accountBanner/index',
          'accountAvatar/index',
          'accountWechatQRCode/index',
          'accountWechatQRCode/result',
          'articles/index',
          'package/index',
          'signin/index',
          'workSpace/index',
          'mySelf/index',
          'digitalGallery/index',
          'activityCenter/index',
          'projectEstate/index',
          'dataStatistics/index',
          'customer/index',
          'customerDetail/index',
          'customerReport/index',
          'mission/index',
          'missionRank/index',
          'missionDetail/index',
          'vrAirplay/index',
          'getClientDetail/index',
          'directList/index',
          'ydxsSignIn/index',
          'customizeCard/index',
          'posterList/index',
          'posterDetail/index',
          'note/index',
          'noteEdit/index',
          'noteDetail/index'
        ]
      },
      {
        root: 'subpackages/im/',
        pages: ['chatList/index', 'chat/index']
      },
      {
        root: 'subpackages/broker/',
        pages: [
          'router/index',
          'report/index',
          'project/index',
          'sale/index',
          'intention/index',
          'customerDetail/index',
          'customerEdit/index',
          'roleSelect/index',
          'roleSelect/supplement',
          'register/index',
          'customerList/index'
        ]
      }
    ],
    preloadRule: {
      'page/mainPage/pages/entry/main': {
        packages: ['subpackages/secondary/'],
        network: 'all'
      },
      'page/mainPage/pages/allHouseList/main': {
        packages: ['subpackages/secondary/'],
        network: 'all'
      },
      'subpackages/secondary/project/index': {
        packages: ['subpackages/other/', 'subpackages/pinTalkPage/'],
        network: 'all'
      },
      'subpackages/seller/signin/index': {
        packages: ['subpackages/im/'],
        network: 'all'
      },
      'subpackages/seller/workSpace/index': {
        packages: ['subpackages/im/'],
        network: 'all'
      }
    },
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTextStyle: 'black',
      navigationStyle: 'custom',
      enablePullDownRefresh: false
    },
    tabBar: {
      custom: true,
      list: [
        {
          pagePath: 'page/mainPage/pages/allHouseList/main',
          text: '首页'
        },
        {
          pagePath: 'page/mainPage/pages/projectList/main',
          text: '列表'
        }
      ]
    },
    permission: {
      'scope.userLocation': {
        desc: '快速获取当前所在城市全部热门项目'
      }
    }
  }

  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Index />
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
