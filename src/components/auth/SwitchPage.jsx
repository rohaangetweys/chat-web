import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function SwitchPage({ dividerText, linkTo, linkText }) {
    return (
        <>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">{dividerText}</span>
                </div>
            </div>

            <div className="text-center">
                <Link
                    href={linkTo}
                    className="inline-flex items-center text-[#0084ff] font-semibold hover:text-[#00b884] transition-colors group"
                >
                    {linkText}
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </>
    )
}
