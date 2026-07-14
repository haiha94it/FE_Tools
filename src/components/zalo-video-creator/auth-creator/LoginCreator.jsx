'use client';
import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import ModalRegister from "../../../container/register/ModalResgister"
import { API_ROUTES, API_URL } from '@/lib/zalo-video/legacy-api';
import { useUser } from '../../../../contexts/UserContext';
import { useAuth } from '../../../../AuthContext';
import { Checkbox } from 'primereact/checkbox';
import ModalResetPass from "../../../container/resetPass/ModalResetPass"

export const LoginCreator = ({ setRfLogin, userInfor, visible, setVisible }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const { modalRe, setModalRe } = useUser();
    const { setUserLoggedIn, userLoggedIn } = useAuth()
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mail, setMail] = useState('');
    const [facebookLink, setFacebookLink] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [namePass, setNamePass] = useState("")
    const [phonePass, setPhonePass] = useState("")
    const [statusLogin, setStatusLogin] = useState(false);
    const router = useRouter();
    const [acceptRegister, setAccecptRegister] = useState(false);
    const loginApi = API_URL + API_ROUTES.LOGIN_API;
    const registerApi = API_URL + API_ROUTES.CREATE_REGISTER;
    const resetPassAPi = API_URL + API_ROUTES.REQUEST_RESET_PASS;

    const [openResetPass, setOpenResetPass] = useState(false);
    const [getStatus, setGetStatus] = useState([]);

    const [tablogin, setTablogin] = useState(false)
    useEffect(() => {
        if (window.location.search === "?register") {
            setActiveIndex(1)
        }
    }, [window.location.search])
    /**
     * Helper function to store data in localStorage with an expiry time.
     * @param {string} key The key under which to store the item.
     * @param {string} value The value to store.
     * @param {number} ttl Time to live in milliseconds.
     */
    function setWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    const handleLogin = async () => {
        try {
            const response = await axios.post(loginApi, {
                username: username,
                password: password,
            });

            if (response.status === 200 && response.data.status !== 400) {
                localStorage.setItem('refresh', response.data.refresh);
                setWithExpiry(
                    'access',
                    response.data.access,
                    7 * 24 * 60 * 60 * 1000, // 7 days expiry
                );
                const expires = new Date();
                expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days for cookie
                document.cookie = `token=${response.data.access}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;
                localStorage.removeItem('expired');
                setRfLogin(pre => !pre)
                toast.success('Đăng nhập thành công!');
                router.push('/zalo-campaigns/post-video');
                setUserLoggedIn(true);
                setUsername("")
                setPassword("")
            } else if (response.data.status === 400) {
                setStatusLogin(!statusLogin); // Toggle for visual feedback
                localStorage.setItem('expired', 'true');
                toast.error(response.data.error || 'Tài khoản hoặc mật khẩu không đúng.');
            }
        } catch (error) {
            console.error("Lỗi khi đăng nhập:", error);
            if (error?.response?.data?.error === 'Tài khoản của bạn đã hết hạn') {
                setVisible(true);
            }
            toast.error(
                error?.response?.data?.error ||
                'Hệ thống đang nâng cấp, vui lòng quay lại sau vài phút nữa.'
            );
        }
    };
    const handleForgotPassword = () => {
        if (!phonePass || !namePass || !username) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
        } else {
            axios
                .post(resetPassAPi, {
                    username: username,
                    fullname: namePass,
                    phone_number: phonePass,
                })
                .then((response) => {
                    setGetStatus(response.data.status);
                })
                .catch((error) => {
                    setGetStatus(error);
                });
            setOpenResetPass(true);
        }
    };
    const handleRegister = async () => {
        if (regPassword !== confirmPassword) {
            toast.error('Mật khẩu và xác nhận mật khẩu không khớp.');
            return;
        }

        try {
            await axios.post(registerApi, {
                facebook_link: facebookLink,
                phone_number: phoneNumber,
                fullname: fullname,
                username: regUsername,
                mail: mail,
                password: regPassword,
                referral_code: referralCode,
            });
            setModalRe(true);
            setPassword('');
            setRegUsername('');
            setRegPassword('');
            setConfirmPassword('');
            setFullname('');
            setPhoneNumber('');
            setMail('');
            setFacebookLink('');
            setReferralCode('');
        } catch (error) {
            console.error("Lỗi khi đăng ký:", error);
            toast.error(
                error?.response?.data?.error ||
                'Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.'
            );
        }
    };

    /**
     * Handles key down events (e.g., Enter key to submit form).
     * @param {Object} e The keyboard event object.
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (activeIndex === 0) {
                if (tablogin) {
                    handleForgotPassword()
                } else {

                    handleLogin();
                }

            } else {
                handleRegister();
            }
        }
    };

    useEffect(() => {
        if (userLoggedIn) {
            setVisible(false)
        } else {
            setVisible(true)
        }
    }, [userLoggedIn])
    // Dynamic footer content based on active tab
    const dialogFooter = (
        <div className="w-100 p-d-flex p-jc-center"> {/* Use PrimeFlex for centering */}
            <nav>
                <p
                    onClick={() => router.push('/')}
                    className='text-sm font-bold text-blue-400 cursor-pointer mb-2'>Trang chủ</p>
            </nav>
            {activeIndex === 0 ? (
                <Button
                    label={tablogin ? "Gửi thông tin" : "Đăng nhập"}
                    className="w-full zaloc-button zaloc-button-primary" // Custom classes for Zalo-like buttons
                    onClick={tablogin ? handleForgotPassword : handleLogin}
                />
            ) : (
                <Button
                    label="Đăng ký"
                    className="w-full zaloc-button zaloc-button-register" // Custom classes for Zalo-like buttons
                    onClick={handleRegister}
                />
            )}

        </div>
    );

    return (
        <Dialog
            header={<span className="dialog-header-title">Video Creator</span>}
            visible={visible}
            maskClassName="custom-dialog-mask"
            style={{ width: '90%', maxWidth: '500px' }}
            modal
            closable
            onHide={() => setVisible(false)}
            footer={dialogFooter}
            className="zaloc-dialog"
        >
            <TabView
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
                className="zaloc-tabview"
            >
                {/* Login Tab */}
                <TabPanel header={tablogin ? "Quên mật khẩu" : "Đăng nhập"}>
                    {tablogin ?
                        <div className="p-fluid zaloc-form-container">
                            <div className="field-group">
                                <label htmlFor="username-login" className="zaloc-label">Tên tài khoản đăng nhập</label>
                                <InputText
                                    id="username-login"
                                    onKeyDown={handleKeyDown}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Tên tài khoản đăng nhập"
                                    className="zaloc-input"
                                    autoComplete="username"
                                />
                            </div>
                            <div className="field-group">
                                <label htmlFor="username-login" className="zaloc-label">Họ và tên</label>
                                <InputText
                                    id="username-login"
                                    onKeyDown={handleKeyDown}
                                    value={namePass}
                                    onChange={(e) => setNamePass(e.target.value)}
                                    placeholder="Họ và tên"
                                    className="zaloc-input"
                                    autoComplete="username" // Thêm autocomplete
                                />
                            </div>
                            <div className="field-group">
                                <label htmlFor="username-login" className="zaloc-label">Số điện thoại đăng ký</label>
                                <InputText
                                    id="username-login"
                                    onKeyDown={handleKeyDown}
                                    value={phonePass}
                                    onChange={(e) => setPhonePass(e.target.value)}
                                    placeholder="Số điện thoại "
                                    className="zaloc-input"
                                    autoComplete="username" // Thêm autocomplete
                                />
                            </div>
                            <div className="text-center mt-3">
                                <a href=""
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setTablogin(false)
                                    }
                                    }
                                    className="forgot-password-link">Đăng nhập</a>
                            </div>
                        </div> :

                        <div className="p-fluid zaloc-form-container">
                            <div className="field-group">
                                <label htmlFor="username-login" className="zaloc-label">Tài khoản</label>
                                <InputText
                                    id="username-login"
                                    onKeyDown={handleKeyDown}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Số điện thoại hoặc email"
                                    className="zaloc-input"
                                    autoComplete="username" // Thêm autocomplete
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="password-login" className="zaloc-label">Mật khẩu</label>
                                {/* Using PrimeReact Password component */}
                                <Password
                                    id="password-login"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    toggleMask // Hiển thị nút ẩn/hiện mật khẩu
                                    feedback={false} // Tắt tính năng gợi ý mật khẩu mạnh
                                    placeholder="Nhập mật khẩu"
                                    className="zaloc-password-input-wrapper" // Wrapper class
                                    inputClassName="zaloc-input" // Apply input styling to inner input
                                    onKeyDown={handleKeyDown}
                                    autoComplete="current-password" // Thêm autocomplete
                                />
                            </div>
                            <div className="text-center mt-3">
                                <a href=""
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setTablogin(true)
                                    }
                                    }
                                    className="forgot-password-link">Quên mật khẩu</a>
                            </div>
                        </div>
                    }

                </TabPanel>

                <TabPanel
                    header="Đăng ký">
                    <div className="p-fluid zaloc-form-container scrollable-content"> {/* Added scrollable-content */}
                        <div className="field-group">
                            <label htmlFor="reg-username" className="zaloc-label">Đặt tên tài khoản đăng nhập</label>
                            <InputText
                                id="reg-username"
                                onKeyDown={handleKeyDown}
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                placeholder="Tên đăng nhập của bạn"
                                className="zaloc-input"
                                autoComplete="new-username"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="fullname" className="zaloc-label">Họ và tên</label>
                            <InputText
                                id="fullname"
                                onKeyDown={handleKeyDown}
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                placeholder="Họ và tên đầy đủ của bạn"
                                className="zaloc-input"
                                autoComplete="name"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="phone-number" className="zaloc-label">Số điện thoại</label>
                            <InputText
                                id="phone-number"
                                onKeyDown={handleKeyDown}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Số điện thoại của bạn"
                                className="zaloc-input"
                                keyfilter="num" // Chỉ cho phép nhập số
                                autoComplete="tel"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="mail" className="zaloc-label">Email</label>
                            <InputText
                                id="mail"
                                onKeyDown={handleKeyDown}
                                value={mail}
                                onChange={(e) => setMail(e.target.value)}
                                placeholder="Địa chỉ email của bạn"
                                className="zaloc-input"
                                type="email"
                                autoComplete="email"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="reg-password" className="zaloc-label">Mật khẩu</label>
                            <Password
                                id="reg-password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                toggleMask
                                feedback={false}
                                placeholder="Nhập mật khẩu"
                                className="zaloc-password-input-wrapper"
                                inputClassName="zaloc-input"
                                onKeyDown={handleKeyDown}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="confirm-password" className="zaloc-label">Xác nhận mật khẩu</label>
                            <Password
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                toggleMask
                                feedback={false}
                                placeholder="Nhập lại mật khẩu"
                                className="zaloc-password-input-wrapper"
                                inputClassName="zaloc-input"
                                onKeyDown={handleKeyDown}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="facebook-link" className="zaloc-label">Liên kết Facebook ( nếu có )</label>
                            <InputText
                                id="facebook-link"
                                onKeyDown={handleKeyDown}
                                value={facebookLink}
                                onChange={(e) => setFacebookLink(e.target.value)}
                                placeholder="Link Facebook của bạn"
                                className="zaloc-input"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="referral-code" className="zaloc-label">Mã giới thiệu ( nếu có )</label>
                            <InputText
                                id="referral-code"
                                onKeyDown={handleKeyDown}
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Mã giới thiệu "
                                className="zaloc-input"
                            />
                        </div>
                        <div
                            className="d-flex flex-column text-dark gap-2 p-2 rounded"
                            style={{
                                maxWidth: '700px',
                                width: 'auto',
                                background: '#d0e1fd',
                                border: '1px solid #86aff3',
                            }}
                        >
                            {' '}
                            <div className="flex align-items-center justify-content-start mt-2 mb-2">
                                <Checkbox
                                    onChange={(e) => setAccecptRegister(e.checked)}
                                    checked={acceptRegister}
                                ></Checkbox>{' '}
                                <label
                                    htmlFor="ingredient1"
                                    className="ml-2 fw-bold mr-2 fs-6"
                                >
                                    Tôi đồng ý với điều khoản
                                </label>
                            </div>
                            <p>
                                - Bằng việc tích chọn vào ô đồng ý. Tôi đồng ý cho Chốt Nhanh
                                xử lý các dữ liệu mà tôi đã điền ở trên theo{' '}
                                <a href="/dieu-khoan" target="_blank">
                                    thỏa thuận sử dụng dịch vụ
                                </a>{' '}
                                Chốt Nhanh và dữ liệu cho các chức năng trên các phần mềm Chốt
                                Nhanh.
                            </p>
                            <p>
                                - Đồng thời, tôi đồng ý để Chốt Nhanh thu thập, xử lý dữ liệu
                                nhằm cho các mục đích hỗ trợ và chăm sóc khách hàng liên quan
                                tới các sản phẩm, dịch vụ của Chốt Nhanh. Theo đây, tôi xác
                                nhận và hiểu rõ các quyền hợp pháp của chủ thể dữ liệu theo
                                quy định tại Nghị Định 13/2023/NĐ-CP về bảo vệ dữ liệu cá
                                nhân.
                            </p>
                            <nav className="w-100 d-flex justify-content-center">
                                <p style={{ fontStyle: 'italic' }}>
                                    Powered by Chốt Nhanh Form.
                                </p>
                            </nav>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            <ModalRegister setModalRe={setModalRe} modalRe={modalRe} />
            <ModalResetPass
                setOpenResetPass={setOpenResetPass}
                openResetPass={openResetPass}
                getStatus={getStatus}
            />
        </Dialog>
    );
};