task :build do
  sh "mkdir -p build"
  chains = File.read('chains.js')
  
  Dir.glob('./*.chains.js').each do |variant|
    wrapper = File.read(variant)
    
    File.open(File.join('build', File.basename(variant)), 'w+') do |f|
      f.write wrapper.gsub('%%% import %%%', chains)
    end
  end
end