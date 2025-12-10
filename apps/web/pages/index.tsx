import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle, Loader2, Shield, Lock, Zap, Users, TrendingUp, ArrowRight, Star, FileText, Wallet, MessageSquare } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { isAuthenticated } from '@/lib/auth';

interface HealthStatus {
  status: string;
  timestamp: string;
}

export default function Home() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Health endpoint is at /api/health (no /api prefix needed since baseURL already has it)
      const response = await apiClient.get('/health', {
        signal: controller.signal,
        timeout: 5000,
      });
      clearTimeout(timeoutId);
      setHealthStatus(response.data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Connection timeout - API may be offline');
      } else if (err.response) {
        setError(`API Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        setError('Network Error - Cannot reach API server. Please ensure the API is running.');
      } else {
        setError(err.message || 'Failed to connect to API');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocal = process.env.NEXT_PUBLIC_ENV === 'local';

  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Your funds are held safely until transaction completion',
      color: 'blue',
    },
    {
      icon: Lock,
      title: 'Protected Payments',
      description: 'Advanced encryption and fraud protection',
      color: 'green',
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Quick verification and instant notifications',
      color: 'yellow',
    },
    {
      icon: Users,
      title: 'Trusted Platform',
      description: 'Verified users and reputation system',
      color: 'purple',
    },
  ];

  return (
    <>
      <Head>
        <title>MYXCROW - Secure Escrow Services for Safe Transactions</title>
        <meta name="description" content="Secure escrow services for safe transactions in Ghana. Protect your payments with MYXCROW's trusted platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Environment Banner */}
        {isLocal && (
          <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
            🚧 Running in LOCAL development mode
          </div>
        )}

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MYXCROW
              </h1>
              <p className="text-2xl text-gray-700 mb-2 font-medium">
                Secure Escrow Services for Safe Transactions
              </p>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Protect your payments with our trusted escrow platform. Funds are held securely until both parties are satisfied.
              </p>
            </div>

            {/* API Health Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${healthStatus ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-gray-400'}`} />
                  System Status
                </h2>
                <button
                  onClick={checkHealth}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </button>
              </div>

              {loading && !healthStatus && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Checking API connection...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
                  <XCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Connection Failed</p>
                    <p className="text-sm text-gray-600">{error}</p>
                  </div>
                </div>
              )}

              {healthStatus && (
                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">API is Healthy</p>
                    <p className="text-sm text-gray-600">
                      Status: {healthStatus.status} | Last checked:{' '}
                      {new Date(healthStatus.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colorClasses = {
                  blue: 'from-blue-500 to-blue-600',
                  green: 'from-green-500 to-green-600',
                  yellow: 'from-yellow-500 to-yellow-600',
                  purple: 'from-purple-500 to-purple-600',
                };
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">Ready to Get Started?</h2>
                <p className="text-blue-100 text-lg">Join thousands of users who trust MYXCROW for secure transactions</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-semibold text-center transition-all border-2 border-white/20"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Link
                href="/login"
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Sign In</h3>
                    <p className="text-gray-600">Access your account to manage escrows</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>

              <Link
                href="/register"
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Sign Up</h3>
                    <p className="text-gray-600">Create a new account to get started</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </Link>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Secure</p>
                <p className="text-sm text-gray-600">Escrow System</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
                <Wallet className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Protected</p>
                <p className="text-sm text-gray-600">Payments</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
                <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">24/7</p>
                <p className="text-sm text-gray-600">Support</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
                <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Trusted</p>
                <p className="text-sm text-gray-600">Platform</p>
              </div>
            </div>

            {/* Developer Tools (Local Only) */}
            {isLocal && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Developer Tools
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <a
                    href={process.env.NEXT_PUBLIC_MAILPIT_URL || 'http://localhost:8025'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    📧 Open Mailpit (Email Testing)
                  </a>
                  <a
                    href={process.env.NEXT_PUBLIC_MINIO_CONSOLE || 'http://localhost:9001'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    📦 Open MinIO Console
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
