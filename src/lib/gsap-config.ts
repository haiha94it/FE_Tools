import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Đăng ký ScrollTrigger một lần duy nhất tại đây.
// Tất cả component import { gsap, ScrollTrigger } từ file này
// thay vì import trực tiếp từ "gsap" / "gsap/ScrollTrigger".
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
