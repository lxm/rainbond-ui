import React, { PureComponent, Fragment } from "react";
import globalUtil from "../../utils/global";
import { connect } from "dva";
import App from "../../../public/images/app.svg";
import ThirForm from "./form.js";
import styles from "./Index.less";

import {
  List,
  Avatar,
  Icon,
  Skeleton,
  Row,
  Col,
  Input,
  Card,
  Typography,
  Modal,
  Form,
  Select,
  Button,
  Spin,
  Tooltip
} from "antd";

@connect()
@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      detection: false,
      lists: [],
      page: 1,
      page_size: 10,
      total: 0,
      loading: true,
      thirdInfo: false,
      search: "",
      event_id: "",
      check_uuid: "",
      create_loading: false,
      create_status: "",
      service_info: "",
      error_infos: "",
      lastPage: true,
      firstPage: true
    };
  }
  componentDidMount() {
    this.handleCodeWarehouseInfo(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.type !== this.props.type) {
      this.handleCodeWarehouseInfo(nextProps);
    }
  }
  onPagePre = () => {
    const { page } = this.state;
    if (page > 1) {
      let pages = page - 1;
      const firstPage = page == 1;
      this.setState({ firstPage, page: pages, loading: true }, () => {
        this.handleCodeWarehouseInfo(this.props);
      });
    }
  };
  onPageNext = () => {
    const { lastPage, page } = this.state;
    if (!lastPage) {
      let pages = page + 1;
      this.setState({ page: pages, loading: true }, () => {
        this.handleCodeWarehouseInfo(this.props);
      });
    }
  };
  handleSearch = search => {
    const _th = this;
    this.setState(
      {
        page: 1,
        loading: true,
        search
      },
      () => {
        _th.handleCodeWarehouseInfo(_th.props);
      }
    );
  };
  //获取代码仓库信息
  handleCodeWarehouseInfo = props => {
    const { page, search } = this.state;
    const { dispatch, type } = props;
    dispatch({
      type: "global/codeWarehouseInfo",
      payload: {
        page,
        search,
        oauth_service_id: type
      },
      callback: res => {
        if (res && res.bean) {
          const firstPage = page == 1;
          const lastPage = res.bean.repositories.length < 10;
          this.setState({
            firstPage,
            lastPage,
            loading: false,
            total: res.bean.total,
            lists: res.bean.repositories
          });
        }
      }
    });
  };

  //代码检测
  handleTestCode = () => {
    const { thirdInfo } = this.state;
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    this.setState(
      {
        create_loading: true
      },
      () => {
        dispatch({
          type: "global/testCode",
          payload: {
            region_name,
            tenant_name: team_name,
            project_url: thirdInfo.project_url,
            version: thirdInfo.project_default_branch,
            oauth_service_id: this.props.type
          },
          callback: res => {
            if (res && res._code === 200) {
              this.setState(
                {
                  event_id: res.data && res.data.bean && res.data.bean.event_id,
                  check_uuid:
                    res.data && res.data.bean && res.data.bean.check_uuid,
                  create_status: "Checking",
                  create_loading: false
                },
                () => {
                  this.handleDetectionCode();
                }
              );
            }
          }
        });
      }
    );
  };
  handleDetectionCode = () => {
    const { event_id, check_uuid } = this.state;
    const { dispatch, type } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const _th = this;
    dispatch({
      type: "global/detectionCode",
      payload: {
        oauth_service_id: type,
        region: region_name,
        tenant_name: team_name,
        check_uuid
      },
      callback: res => {
        if (res && res._code === 200) {
          if (
            res.bean &&
            res.bean.check_status != "Success" &&
            res.bean.check_status != "Failure"
          ) {
            this.timer = setTimeout(function() {
              _th.handleDetectionCode();
            }, 3000);
          } else {
            clearTimeout(this.timer);
            this.setState({
              create_status: res.bean && res.bean.check_status,
              service_info: res.bean && res.bean.service_info,
              error_infos: res.bean && res.bean.error_infos
            });
          }
        }
      }
    });
  };
  componentWillUnmount() {
    this.timer && clearTimeout(this.timer);
  }
  showModal = thirdInfo => {
    this.setState({
      visible: true,
      thirdInfo
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  handleDetection = () => {
    this.timer && clearTimeout(this.timer);
    this.setState({
      detection: false,
      create_status: "",
      service_info: "",
      error_infos: ""
    });
  };
  handleOpenDetection = thirdInfo => {
    this.setState({
      thirdInfo,
      detection: true
    });
  };
  render() {
    const {
      visible,
      detection,
      lists,
      loading,
      thirdInfo,
      create_loading,
      firstPage,
      lastPage
    } = this.state;
    const { handleType } = this.props;
    let ServiceComponent = handleType && handleType === "Service";
    return (
      <div
        style={{
          background: ServiceComponent ? "#fff " : "#F0F2F5"
        }}
      >
        {this.state.detection && (
          <Modal
            visible={detection}
            onCancel={this.handleDetection}
            title="检测语言"
            footer={
              !this.state.create_status
                ? [
                    <Button key="back" onClick={this.handleDetection}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      loading={create_loading}
                      onClick={this.handleTestCode}
                    >
                      检测
                    </Button>
                  ]
                : this.state.create_status == "Success"
                ? [
                    <Button key="back" onClick={this.handleDetection}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleDetection}
                    >
                      确认
                    </Button>
                  ]
                : [
                    <Button key="back" onClick={this.handleDetection}>
                      关闭
                    </Button>
                  ]
            }
          >
            <div>
              {this.state.create_status == "Checking" ||
              this.state.create_status == "Complete" ? (
                <div>
                  <p style={{ textAlign: "center" }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测中，请稍后(请勿关闭弹窗)
                  </p>
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Failure" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon
                      style={{
                        color: "#f5222d",
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>
                  {this.state.error_infos &&
                    this.state.error_infos.map(items => {
                      return (
                        <div>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `<span>${items.error_info ||
                                ""} ${items.solve_advice || ""}</span>`
                            }}
                          />
                        </div>
                      );
                      // <p style={{ textAlign: 'center', fontSize: '14px' }}>{item.key}:{item.value} </p>
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Success" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </p>

                  {this.state.service_info &&
                    this.state.service_info.map(item => {
                      return (
                        <p style={{ textAlign: "center", fontSize: "14px" }}>
                          检测语言:{item.language}{" "}
                        </p>
                      );
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Failed" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "999",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测失败，请重新检测
                  </p>
                </div>
              ) : (
                ""
              )}

              {!this.state.create_status && (
                <div>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    确定要检测语言吗?
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {!visible ? (
          <List
            loading={loading}
            className={styles.lists}
            header={
              <Input.Search
                ref="searchs"
                placeholder="请输入搜索内容"
                enterButton="搜索"
                size="large"
                onSearch={this.handleSearch}
                style={{
                  width: 522,
                  padding: "0 0 11px 0"
                }}
              />
            }
            footer={
              <div
                style={{
                  textAlign: "right",
                  marginBottom: ServiceComponent ? "40px" : "0"
                }}
              >
                {!firstPage && (
                  <Button
                    style={{ marginRight: "5px" }}
                    onClick={this.onPagePre}
                    loading={loading}
                  >
                    上一页
                  </Button>
                )}
                {!lastPage && (
                  <Button loading={loading} onClick={this.onPageNext}>
                    下一页
                  </Button>
                )}
              </div>
            }
            dataSource={lists}
            gutter={1}
            renderItem={item => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <div>
                    <a
                      onClick={() => {
                        this.handleOpenDetection(item);
                      }}
                    >
                      检测语言
                    </a>
                    <a
                      style={{ marginLeft: "16px" }}
                      onClick={() => {
                        this.showModal(item);
                      }}
                    >
                      创建组件
                    </a>
                  </div>
                ]}
              >
                <Skeleton avatar title={false} loading={false} active>
                  <List.Item.Meta
                    style={{
                      alignItems: "center",
                      overflow: "hidden"
                    }}
                    avatar={<Avatar src={App} />}
                    title={
                      <a target="_blank" href={item.project_url}>
                        <div className={styles.listItemMataTitle}>
                          <Tooltip title={item.project_name}>
                            <div>{item.project_name || "-"}</div>
                          </Tooltip>
                          <Tooltip
                            title={
                              item.project_full_name &&
                              item.project_full_name.split("/")[0]
                            }
                          >
                            <div>
                              {item.project_full_name &&
                                item.project_full_name.split("/")[0]}
                            </div>
                          </Tooltip>
                        </div>
                      </a>
                    }
                  />
                  {!ServiceComponent && (
                    <Row
                      justify="center"
                      style={{
                        width: "70%",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden"
                      }}
                    >
                      <Col span={8}>
                        <Tooltip title={item.project_description}>
                          <div
                            className={styles.listItemMataDesc}
                            style={{ paddingLeft: "10px" }}
                          >
                            {item.project_description}
                          </div>
                        </Tooltip>
                      </Col>

                      <Col span={ServiceComponent ? 12 : 8}>
                        <Tooltip title={item.project_default_branch}>
                          <div className={styles.listItemMataBranch}>
                            <Icon
                              type="apartment"
                              style={{ marginRight: "5px" }}
                            />
                            {item.project_default_branch || "-"}
                          </div>
                        </Tooltip>
                      </Col>
                    </Row>
                  )}
                </Skeleton>
              </List.Item>
            )}
          />
        ) : (
          <Card bordered={false} style={{ padding: "24px 32px" }}>
            <Icon
              style={{ fontSize: "16px", marginRight: "8px" }}
              type="arrow-left"
              onClick={this.handleCancel}
            />
            回到列表
            <div
              className={styles.formWrap}
              style={{
                marginTop: ServiceComponent ? "25px" : "0",
                width: ServiceComponent ? "auto" : "500px"
              }}
            >
              <ThirForm
                onSubmit={this.props.handleSubmit}
                {...this.props}
                ServiceComponent={ServiceComponent}
                thirdInfo={thirdInfo}
              />
            </div>
          </Card>
        )}
      </div>
    );
  }
}

export default Index;
